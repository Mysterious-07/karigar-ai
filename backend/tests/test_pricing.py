import uuid
import pytest
from unittest.mock import patch
from app.schemas.pricing import PricingResponse

@pytest.fixture
def sample_product(client):
    artisan_res = client.post("/api/artisans", json={
        "name": "Ramesh Kumar",
        "phone": "9876543210",
        "location": "Palghar",
        "state": "Maharashtra",
        "language": "mr",
        "craft_type": "Warli Art"
    })
    artisan_id = artisan_res.json()["id"]

    # Login to get token (product creation & pricing require auth)
    login_res = client.post("/api/auth/verify-otp", json={"phone": "9876543210", "otp": "123456"})
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    prod_res = client.post("/api/products", json={
        "artisan_id": artisan_id,
        "title": "Warli Painting",
        "craft_type": "Warli Art",
        "description": "Handmade Warli canvas artwork",
        "category": "Paintings & Wall Art"
    }, headers=headers)
    return prod_res.json()["id"], headers

# 1. Valid pricing input (mocked AI response)
@patch("app.services.pricing_service.pricing_service.calculate_price_guidance")
def test_suggest_price_valid_input(mock_pricing, client, sample_product):
    sample_product, headers = sample_product
    mock_pricing.return_value = PricingResponse(
        suggested_min_price=1800.0,
        suggested_max_price=2400.0,
        suggested_price=2100.0,
        currency="₹",
        confidence="High",
        explanation="Guidance based on direct material and artisan labour costs.",
        factors=["Artisan labour effort", "Material costs"],
        warnings=[]
    )
    payload = {
        "material_cost": 600.0,
        "labour_cost": 900.0,
        "other_cost": 200.0,
        "production_time": "3 days",
        "language": "en"
    }
    response = client.post(f"/api/products/{sample_product}/suggest-price", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["suggested_min_price"] > 0
    assert data["suggested_max_price"] >= data["suggested_min_price"]
    assert data["currency"] == "₹"
    assert data["confidence"] == "High"

# 2. Negative cost rejection (422)
def test_suggest_price_negative_cost_rejection(client, sample_product):
    sample_product, headers = sample_product
    payload = {
        "material_cost": -500.0, # Negative cost invalid
        "labour_cost": 900.0
    }
    response = client.post(f"/api/products/{sample_product}/suggest-price", json=payload, headers=headers)
    assert response.status_code == 422

# 3. Missing optional fields (mocked AI response)
@patch("app.services.pricing_service.pricing_service.calculate_price_guidance")
def test_suggest_price_missing_optional_fields(mock_pricing, client, sample_product):
    sample_product, headers = sample_product
    mock_pricing.return_value = PricingResponse(
        suggested_min_price=1500.0,
        suggested_max_price=2700.0,
        suggested_price=2100.0,
        currency="₹",
        confidence="Low",
        explanation="Estimated pricing guidance.",
        factors=["Handmade artisanal craftsmanship"],
        warnings=["Providing exact material and labour costs improves price guidance precision."]
    )
    payload = {
        "language": "mr"
    }
    response = client.post(f"/api/products/{sample_product}/suggest-price", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["confidence"] == "Low"
    assert len(data["warnings"]) > 0

# 4. Grok success (mocked)
@patch("app.services.pricing_service.PricingService.calculate_price_guidance")
def test_suggest_price_grok_success(mock_pricing, client, sample_product):
    sample_product, headers = sample_product
    mock_pricing.return_value = PricingResponse(
        suggested_min_price=1800.0,
        suggested_max_price=2400.0,
        suggested_price=2100.0,
        currency="₹",
        confidence="High",
        explanation="Guidance based on direct material and artisan labour costs.",
        factors=["Artisan labour effort", "Material costs"],
        warnings=[]
    )

    response = client.post(f"/api/products/{sample_product}/suggest-price", json={
        "material_cost": 600.0,
        "labour_cost": 900.0
    }, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["suggested_price"] == 2100.0

# 5. Grok malformed JSON — must return 503, NOT silent fallback
@patch("openai.resources.chat.completions.Completions.create")
def test_suggest_price_grok_malformed_json(mock_chat, client, sample_product):
    sample_product, headers = sample_product
    # Simulate malformed non-JSON output from LLM
    mock_chat.return_value.choices = [
        type("Choice", (), {"message": type("Message", (), {"content": "Not JSON text"})()})()
    ]
    response = client.post(f"/api/products/{sample_product}/suggest-price", json={
        "material_cost": 500.0,
        "labour_cost": 800.0
    }, headers=headers)
    assert response.status_code == 503
    assert "AI pricing guidance failed" in response.json()["detail"]

# 6. Grok API failure — must return 503, NOT silent fallback
@patch("openai.resources.chat.completions.Completions.create")
def test_suggest_price_grok_api_failure(mock_chat, client, sample_product):
    sample_product, headers = sample_product
    mock_chat.side_effect = Exception("API Connection Failed")
    response = client.post(f"/api/products/{sample_product}/suggest-price", json={
        "material_cost": 400.0,
        "labour_cost": 600.0
    }, headers=headers)
    assert response.status_code == 503
    assert "AI pricing guidance failed" in response.json()["detail"]

# 7. Price persistence in PostgreSQL (mocked AI response)
@patch("app.services.pricing_service.pricing_service.calculate_price_guidance")
def test_suggest_price_persistence(mock_pricing, client, sample_product):
    sample_product, headers = sample_product
    mock_pricing.return_value = PricingResponse(
        suggested_min_price=1800.0,
        suggested_max_price=2400.0,
        suggested_price=2100.0,
        currency="₹",
        confidence="High",
        explanation="Guidance based on direct material and artisan labour costs.",
        factors=["Artisan labour effort", "Material costs"],
        warnings=[]
    )
    payload = {
        "material_cost": 600.0,
        "labour_cost": 900.0,
        "other_cost": 200.0
    }
    client.post(f"/api/products/{sample_product}/suggest-price", json=payload, headers=headers)
    
    # Retrieve product and check DB attributes (public GET)
    prod_res = client.get(f"/api/products/{sample_product}")
    assert prod_res.status_code == 200
    data = prod_res.json()
    assert data["material_cost"] == 600.0
    assert data["suggested_price"] is not None

# 8. Product not found (404)
def test_suggest_price_product_not_found(client, db_session):
    # Create artisan & login so auth passes, then verify 404 for missing product
    from app.db.models.artisan import Artisan
    artisan = Artisan(name="Price Test", phone="9005556666", location="M", state="MH",
                      language="hi", craft_type="Craft")
    db_session.add(artisan)
    db_session.commit()

    login_res = client.post("/api/auth/verify-otp", json={"phone": "9005556666", "otp": "123456"})
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    fake_id = str(uuid.uuid4())
    response = client.post(f"/api/products/{fake_id}/suggest-price", json={"material_cost": 100.0}, headers=headers)
    assert response.status_code == 404
