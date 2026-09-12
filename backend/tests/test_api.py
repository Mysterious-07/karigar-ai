import uuid
from sqlalchemy import text

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_database_connection(db_session):
    result = db_session.execute(text("SELECT 1")).scalar()
    assert result == 1

def test_artisan_creation_and_retrieval(client):
    payload = {
        "name": "Ramesh Kumar",
        "phone": "+91 9876543210",
        "email": "ramesh@example.com",
        "location": "Jaipur",
        "state": "Rajasthan",
        "language": "Hindi",
        "craft_type": "Blue Pottery",
        "bio": "Master artisan in Jaipur traditional pottery."
    }
    # 1. Create Artisan
    response = client.post("/api/artisans", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert "id" in data
    artisan_id = data["id"]

    # 2. Retrieve Artisan (public view - phone masked for non-owners)
    get_response = client.get(f"/api/artisans/{artisan_id}")
    assert get_response.status_code == 200
    get_data = get_response.json()
    assert get_data["id"] == artisan_id
    # Phone may be masked for non-owners (security feature)
    assert "phone" in get_data

def test_invalid_artisan_id(client):
    random_id = str(uuid.uuid4())
    response = client.get(f"/api/artisans/{random_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_product_creation_and_retrieval(client):
    # First create an artisan (signup)
    artisan_payload = {
        "name": "Sunita Devi",
        "phone": "+91 9123456789",
        "location": "Varanasi",
        "state": "Uttar Pradesh",
        "language": "Hindi",
        "craft_type": "Banarasi Silk Weaver"
    }
    artisan_res = client.post("/api/artisans", json=artisan_payload)
    artisan_id = artisan_res.json()["id"]
    
    # Login the artisan to get a token
    login_res = client.post("/api/auth/verify-otp", json={"phone": "9123456789", "otp": "123456"})
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    # The authenticated artisan has a different ID than the one created above
    authenticated_artisan_id = login_res.json()["artisan"]["id"]

    # Create Product with authentication (artisan_id ignored, uses authenticated user)
    product_payload = {
        "title": "Handwoven Banarasi Silk Saree",
        "craft_type": "Silk Weaving",
        "description": "Exquisite handwoven Zari Banarasi saree",
        "category": "Apparel",
        "material": "Pure Silk & Zari",
        "dimensions": "6.5 meters",
        "production_time": "15 days",
        "price": 12500.0
    }
    prod_res = client.post("/api/products", json=product_payload, headers=headers)
    assert prod_res.status_code == 201
    prod_data = prod_res.json()
    assert prod_data["title"] == product_payload["title"]
    # artisan_id is the authenticated user's ID, not the originally created artisan
    assert prod_data["artisan_id"] == authenticated_artisan_id
    product_id = prod_data["id"]

    # Retrieve Product by ID (public access)
    get_prod = client.get(f"/api/products/{product_id}")
    assert get_prod.status_code == 200
    assert get_prod.json()["id"] == product_id

    # Retrieve Products by Artisan ID (public view)
    artisan_prods = client.get(f"/api/artisans/{authenticated_artisan_id}/products")
    assert artisan_prods.status_code == 200
    prods_list = artisan_prods.json()
    assert len(prods_list) == 1
    assert prods_list[0]["id"] == product_id

def test_invalid_product_id(client):
    random_id = str(uuid.uuid4())
    response = client.get(f"/api/products/{random_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_create_product_with_nonexistent_artisan(client):
    """Verify that artisan_id from frontend is ignored - product is created 
    for the authenticated artisan only."""
    # Create artisan and login
    artisan_res = client.post("/api/artisans", json={
        "name": "Test Artisan",
        "phone": "9999988888",
        "location": "Mumbai",
        "state": "Maharashtra",
        "language": "hi",
        "craft_type": "Test Craft"
    })
    login_res = client.post("/api/auth/verify-otp", json={"phone": "9999988888", "otp": "123456"})
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    random_artisan_id = str(uuid.uuid4())
    product_payload = {
        "artisan_id": random_artisan_id,  # This should be IGNORED
        "title": "Orphan Product",
        "craft_type": "Wood Carving"
    }
    response = client.post("/api/products", json=product_payload, headers=headers)
    assert response.status_code == 201
    # Product should be created for the authenticated artisan, not the provided artisan_id
    assert response.json()["artisan_id"] != random_artisan_id
    assert "artisan_id" not in product_payload or response.json()["artisan_id"] == login_res.json()["artisan"]["id"]
