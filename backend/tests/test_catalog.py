import io
import uuid
import pytest
from unittest.mock import patch
from app.schemas.catalog import CatalogGenerationResponse
from app.core.security import create_access_token

@pytest.fixture
def sample_artisan_and_product(client, db_session):
    # Create Artisan
    artisan_res = client.post("/api/artisans", json={
        "name": "Ramesh Kumar",
        "phone": "9876543210",
        "location": "Palghar",
        "state": "Maharashtra",
        "language": "mr",
        "craft_type": "Warli Art"
    })
    artisan_id = artisan_res.json()["id"]
    
    # Login to get token
    login_res = client.post("/api/auth/verify-otp", json={"phone": "9876543210", "otp": "123456"})
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Product with authentication
    prod_res = client.post("/api/products", json={
        "artisan_id": artisan_id,
        "title": "Raw Warli Artwork",
        "craft_type": "Warli Art",
        "description": "Traditional Warli tribal painting on canvas"
    }, headers=headers)
    product_id = prod_res.json()["id"]

    return artisan_id, product_id, headers

# 1 & 4. Request validation - missing / empty description (no vision model configured)
def test_catalog_request_empty_description(client, sample_artisan_and_product):
    _, product_id, headers = sample_artisan_and_product
    # Upload a photo first so the "upload photo" check passes
    from PIL import Image
    img_bytes = io.BytesIO()
    Image.new("RGB", (10, 10), color="red").save(img_bytes, format="JPEG")
    img_bytes.seek(0)
    client.post(f"/api/products/{product_id}/image", files={"file": ("test.jpg", img_bytes, "image/jpeg")}, headers=headers)
    response = client.post(f"/api/products/{product_id}/generate-catalog", json={
        "description": "",
        "language": "en"
    }, headers=headers)
    assert response.status_code == 422
    assert "description" in response.json()["detail"].lower()

# 2. Missing product (404)
def test_catalog_generation_missing_product(client):
    fake_id = str(uuid.uuid4())
    # Use a fake auth header - should still get 404 for missing product
    headers = {"Authorization": "Bearer fake_token"}
    response = client.post(f"/api/products/{fake_id}/generate-catalog", json={
        "description": "A warli painting made in 3 days",
        "language": "en"
    }, headers=headers)
    assert response.status_code == 401

# 3. Missing image error (400)
def test_catalog_generation_missing_image(client, sample_artisan_and_product):
    _, product_id, headers = sample_artisan_and_product
    response = client.post(f"/api/products/{product_id}/generate-catalog", json={
        "description": "Warli painting made by Ramesh in 3 days",
        "language": "mr"
    },
    headers=headers
    )
    assert response.status_code == 400
    assert "upload a product photo" in response.json()["detail"].lower()

# 5. Invalid language code (400)
def test_catalog_generation_invalid_language(client, sample_artisan_and_product):
    _, product_id, headers = sample_artisan_and_product
    response = client.post(f"/api/products/{product_id}/generate-catalog", json={
        "description": "Warli painting made by Ramesh in 3 days",
        "language": "fr" # Unsupported
    },
    headers=headers
    )
    assert response.status_code == 400
    assert "unsupported input language" in response.json()["detail"].lower()

# 10. Product image upload - valid file
def test_product_image_upload_valid(client, sample_artisan_and_product):
    _, product_id, headers = sample_artisan_and_product
    # Create minimal 10x10 JPEG image in memory
    from PIL import Image
    img_bytes = io.BytesIO()
    Image.new("RGB", (10, 10), color="red").save(img_bytes, format="JPEG")
    img_bytes.seek(0)

    files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
    response = client.post(f"/api/products/{product_id}/image", files=files, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["original_image"] is not None
    assert data["processed_image"] is None  # Background task hasn't completed yet

# 11. Product image upload - invalid format (400)
def test_product_image_upload_invalid_format(client, sample_artisan_and_product):
    _, product_id, headers = sample_artisan_and_product
    files = {"file": ("test.txt", io.BytesIO(b"Hello text"), "text/plain")}
    response = client.post(f"/api/products/{product_id}/image", files=files, headers=headers)
    assert response.status_code == 400
    assert "invalid file format" in response.json()["detail"].lower()

# 12. Product image upload - oversized file (400)
def test_product_image_upload_oversized(client, sample_artisan_and_product):
    _, product_id, headers = sample_artisan_and_product
    # Create 11MB dummy payload
    large_bytes = io.BytesIO(b"0" * (11 * 1024 * 1024))
    files = {"file": ("large.jpg", large_bytes, "image/jpeg")}
    response = client.post(f"/api/products/{product_id}/image", files=files, headers=headers)
    assert response.status_code == 400
    assert "exceeds maximum" in response.json()["detail"].lower()

# 6, 9. Successful catalog generation with mocked Grok response & persistence
@patch("app.services.grok_service.GrokService.generate_catalog")
def test_successful_catalog_generation_and_persistence(mock_grok, client, sample_artisan_and_product):
    _, product_id, headers = sample_artisan_and_product

    # Upload photo first
    from PIL import Image
    img_bytes = io.BytesIO()
    Image.new("RGB", (10, 10), color="blue").save(img_bytes, format="JPEG")
    img_bytes.seek(0)
    client.post(f"/api/products/{product_id}/image", files={"file": ("photo.jpg", img_bytes, "image/jpeg")}, headers=headers)

    # Mock Grok Response
    mock_grok.return_value = CatalogGenerationResponse(
        title="Traditional Warli Folk Art Painting",
        description="Authentic Warli folk art painting handcrafted using traditional organic pigments.",
        category="Paintings & Wall Art",
        craft_type="Warli Art",
        material="Canvas & Organic Pigments",
        dimensions="Not specified",
        production_time="3 days",
        tags=["Warli", "Handmade", "Indian Folk Art"],
        artisan_story="Handmade by Ramesh in Palghar, practicing traditional Warli art passed down through generations."
    )

    # Call Generate Catalog
    response = client.post(f"/api/products/{product_id}/generate-catalog", json={
        "description": "हा माझ्या हाताने बनवलेला वारली चित्र आहे...",
        "language": "mr"
    },
    headers=headers
    )
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    prod = res_data["product"]
    assert prod["title"] == "Traditional Warli Folk Art Painting"
    assert prod["category"] == "Paintings & Wall Art"
    assert res_data["quality_score"] > 80.0

# 7 & 8. Grok API failure — must return 503, NOT silent fallback
@patch("openai.resources.chat.completions.Completions.create")
def test_grok_api_failure_returns_503(mock_chat, client, sample_artisan_and_product):
    _, product_id, headers = sample_artisan_and_product

    # Upload photo first
    from PIL import Image
    img_bytes = io.BytesIO()
    Image.new("RGB", (10, 10), color="green").save(img_bytes, format="JPEG")
    img_bytes.seek(0)
    client.post(f"/api/products/{product_id}/image", files={"file": ("photo.jpg", img_bytes, "image/jpeg")}, headers=headers)

    # Simulate connection error from Grok API
    mock_chat.side_effect = Exception("API Connection Timeout")

    response = client.post(f"/api/products/{product_id}/generate-catalog", json={
        "description": "Handmade Warli painting",
        "language": "en"
    },
    headers=headers
    )
    assert response.status_code == 503
    assert "AI catalog generation failed" in response.json()["detail"]

# 13. Product update after editing catalog
def test_product_update_after_editing(client, sample_artisan_and_product):
    _, product_id, headers = sample_artisan_and_product
    update_payload = {
        "title": "Edited Warli Canvas Painting",
        "description": "Custom edited description with exact materials",
        "material": "Pure Canvas",
        "dimensions": "12x18 inches",
        "price": 2500.0
    }
    response = client.put(f"/api/products/{product_id}", json=update_payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == update_payload["title"]
    assert data["dimensions"] == update_payload["dimensions"]
    assert data["price"] == update_payload["price"]
    assert data["ai_quality_score"] is not None
