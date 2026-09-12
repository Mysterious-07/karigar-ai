import uuid
import pytest
from app.db.models.buyer import Buyer
from app.services.matching_service import matching_service
from app.core.security import create_access_token

@pytest.fixture
def sample_product_and_buyers(db_session, client):
    # 1. Create Artisan & Product
    artisan_res = client.post("/api/artisans", json={
        "name": "Sunita Devi",
        "phone": "9123456789",
        "location": "Varanasi",
        "state": "Uttar Pradesh",
        "language": "hi",
        "craft_type": "Banarasi Silk Weaving"
    })
    artisan_id = artisan_res.json()["id"]

    # Login to get token
    login_res = client.post("/api/auth/verify-otp", json={"phone": "9123456789", "otp": "123456"})
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    prod_res = client.post("/api/products", json={
        "artisan_id": artisan_id,
        "title": "Banarasi Zari Saree",
        "craft_type": "Banarasi Silk Weaving",
        "description": "Handwoven pure Banarasi silk saree with Zari work",
        "category": "Fashion & Textiles",
        "price": 12500.0
    }, headers=headers)
    product_id = uuid.UUID(prod_res.json()["id"])

    # 2. Seed buyers in test DB
    b1 = Buyer(
        business_name="Varanasi Silk Emporium",
        buyer_type="Boutique",
        location="Varanasi",
        state="Uttar Pradesh",
        category="Fashion & Textiles",
        preferred_crafts="Banarasi Silk Weaving, Handloom",
        preferred_categories="Fashion & Textiles, Apparel",
        budget_min=5000.0,
        budget_max=20000.0,
        bulk_order_interest="Yes"
    )
    b2 = Buyer(
        business_name="Delhi Home Decor",
        buyer_type="Home Decor Store",
        location="Delhi",
        state="Delhi",
        category="Home Decor",
        preferred_crafts="Pottery & Ceramics",
        preferred_categories="Home Decor",
        budget_min=1000.0,
        budget_max=4000.0,
        bulk_order_interest="No"
    )
    db_session.add(b1)
    db_session.add(b2)
    db_session.commit()

    return product_id, b1, b2, headers

# 1. Buyer matching endpoint
def test_match_buyers_endpoint(client, sample_product_and_buyers):
    product_id, _, _, headers = sample_product_and_buyers
    response = client.post(f"/api/products/{product_id}/match-buyers?language=en", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert "match_score" in data[0]

# 2. Craft match scoring calculation
def test_craft_match_scoring(db_session, sample_product_and_buyers):
    product_id, b1, b2, _ = sample_product_and_buyers
    from app.db.models.product import Product
    prod = db_session.query(Product).filter(Product.id == product_id).first()

    score1 = matching_service.calculate_match_score(prod, b1)
    score2 = matching_service.calculate_match_score(prod, b2)

    assert score1 > score2  # b1 has exact Banarasi craft match
    # With configurable weights (30 craft + 25 category + 20 budget + 15 buyer_type + 10 bulk),
    # b1 gets: 30 (exact craft) + 25 (exact category) + 20 (budget in range) + 15 (boutique) + 10 (bulk) = 100
    assert score1 >= 90.0

# 3. Category match scoring
def test_category_match_scoring(db_session, sample_product_and_buyers):
    product_id, b1, _, _ = sample_product_and_buyers
    from app.db.models.product import Product
    prod = db_session.query(Product).filter(Product.id == product_id).first()
    score = matching_service.calculate_match_score(prod, b1)
    assert score > 50.0

# 4. Budget compatibility calculation
def test_budget_compatibility_scoring(db_session, sample_product_and_buyers):
    product_id, b1, b2, _ = sample_product_and_buyers
    from app.db.models.product import Product
    prod = db_session.query(Product).filter(Product.id == product_id).first()

    # b1 budget range (5000 - 20000) includes product price 12500
    score_b1 = matching_service.calculate_match_score(prod, b1)
    # b2 budget range (1000 - 4000) is far below 12500
    score_b2 = matching_service.calculate_match_score(prod, b2)

    # b1: 30+25+20+15+10=100, b2: 5+5+5+15+5=35 (budget far outside range)
    assert score_b1 > score_b2
    assert score_b1 >= 90.0

# 5. Buyer ranking descending order
def test_buyer_ranking_order(client, sample_product_and_buyers):
    product_id, _, _, headers = sample_product_and_buyers
    response = client.post(f"/api/products/{product_id}/match-buyers", headers=headers)
    assert response.status_code == 200
    data = response.json()
    if len(data) >= 2:
        assert data[0]["match_score"] >= data[1]["match_score"]

# 6. Empty buyer list handling
def test_empty_buyer_list_handling(client, db_session):
    # Create artisan & login
    artisan_res = client.post("/api/artisans", json={
        "name": "Single Artisan",
        "phone": "9999999999",
        "location": "Jaipur",
        "state": "Rajasthan",
        "language": "en",
        "craft_type": "Pottery"
    })
    artisan_id = artisan_res.json()["id"]
    login_res = client.post("/api/auth/verify-otp", json={"phone": "9999999999", "otp": "123456"})
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    prod_res = client.post("/api/products", json={"artisan_id": artisan_id, "title": "Vase", "craft_type": "Pottery"}, headers=headers)
    prod_id = prod_res.json()["id"]

    # Delete all buyers in DB
    from app.db.models.buyer import Buyer
    db_session.query(Buyer).delete()
    db_session.commit()

    response = client.post(f"/api/products/{prod_id}/match-buyers", headers=headers)
    assert response.status_code == 200
    assert response.json() == []

# 7. Match persistence & retrieval
def test_match_persistence_and_retrieval(client, sample_product_and_buyers):
    product_id, _, _, headers = sample_product_and_buyers
    # 1. Post matches
    match_post = client.post(f"/api/products/{product_id}/match-buyers", headers=headers)
    assert match_post.status_code == 200

    # 2. Get saved matches
    match_get = client.get(f"/api/products/{product_id}/matches", headers=headers)
    assert match_get.status_code == 200
    assert len(match_get.json()) > 0

# 8. Record buyer interest status update
def test_record_buyer_interest_status(client, sample_product_and_buyers):
    product_id, _, _, headers = sample_product_and_buyers
    match_res = client.post(f"/api/products/{product_id}/match-buyers", headers=headers)
    match_id = match_res.json()[0]["id"]

    # Click Send Interest
    interest_res = client.post(f"/api/products/{product_id}/matches/{match_id}/interest", headers=headers)
    assert interest_res.status_code == 200
    data = interest_res.json()
    assert data["success"] is True
    assert data["status"] == "contacted"
    assert "Interest request recorded" in data["message"]

# 9. Product not found (404)
def test_matching_product_not_found(client, db_session):
    # Create artisan & login so auth passes, then verify 404 for missing product
    from app.db.models.artisan import Artisan
    artisan = Artisan(name="Fake Artisan", phone="9001112222", location="M", state="MH",
                      language="hi", craft_type="Craft")
    db_session.add(artisan)
    db_session.commit()

    login_res = client.post("/api/auth/verify-otp", json={"phone": "9001112222", "otp": "123456"})
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    fake_id = str(uuid.uuid4())
    response = client.post(f"/api/products/{fake_id}/match-buyers", headers=headers)
    assert response.status_code == 404
