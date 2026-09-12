import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from app.db.models.artisan import Artisan
from app.db.models.product import Product
from app.db.models.store import Store, StoreProduct
from app.db.models.enquiry import Enquiry
from app.services.store_service import generate_store_slug, generate_product_slug, ensure_artisan_store, add_product_to_store
from app.services.qr_service import get_store_url, save_store_qr_code, generate_qr_code_bytes

def test_store_creation_and_slug_generation(db_session, client: TestClient):
    # 1. Create artisan
    artisan = Artisan(
        name="Ramesh",
        phone="9876543210",
        location="Palghar",
        state="Maharashtra",
        craft_type="Warli Art"
    )
    db_session.add(artisan)
    db_session.commit()
    db_session.refresh(artisan)

    # 2. Ensure store created
    store = ensure_artisan_store(artisan.id, db_session)
    assert store is not None
    assert store.slug == "ramesh-warli-art"
    assert store.is_public is True

def test_duplicate_slug_handling(db_session):
    artisan1 = Artisan(name="Ramesh", phone="9876543210", location="Palghar", state="Maharashtra", craft_type="Warli Art")
    artisan2 = Artisan(name="Ramesh", phone="9876543211", location="Palghar", state="Maharashtra", craft_type="Warli Art")
    db_session.add_all([artisan1, artisan2])
    db_session.commit()

    store1 = ensure_artisan_store(artisan1.id, db_session)
    store2 = ensure_artisan_store(artisan2.id, db_session)

    assert store1.slug == "ramesh-warli-art"
    assert store2.slug == "ramesh-warli-art-2"

def test_public_store_retrieval(db_session, client: TestClient):
    artisan = Artisan(name="Anita Devi", phone="9988776655", location="Madhubani", state="Bihar", craft_type="Madhubani Painting", bio="Master artisan.")
    db_session.add(artisan)
    db_session.commit()

    store = ensure_artisan_store(artisan.id, db_session)

    res = client.get(f"/api/public/stores/{store.slug}")
    assert res.status_code == 200
    data = res.json()
    assert data["artisan_name"] == "Anita Devi"
    assert data["craft_type"] == "Madhubani Painting"
    assert data["slug"] == "anita-devi-madhubani-painting"

def test_private_store_rejection(db_session, client: TestClient):
    artisan = Artisan(name="Private Artisan", phone="9999988888", location="Jaipur", state="Rajasthan", craft_type="Blue Pottery")
    db_session.add(artisan)
    db_session.commit()

    store = ensure_artisan_store(artisan.id, db_session)
    store.is_public = False
    db_session.commit()

    res = client.get(f"/api/public/stores/{store.slug}")
    assert res.status_code == 404

def test_public_product_retrieval_and_slug(db_session, client: TestClient):
    artisan = Artisan(name="Suresh", phone="9123456789", location="Kutch", state="Gujarat", craft_type="Ajrakh Printing")
    db_session.add(artisan)
    db_session.commit()

    store = ensure_artisan_store(artisan.id, db_session)

    product = Product(
        artisan_id=artisan.id,
        title="Traditional Ajrakh Shawl",
        craft_type="Ajrakh Printing",
        description="Hand-printed natural dye cotton shawl.",
        material="Pure Cotton",
        price=2500.0,
        suggested_min_price=2200.0,
        suggested_max_price=2800.0
    )
    db_session.add(product)
    db_session.commit()

    add_product_to_store(store.id, product.id, db_session)

    # Fetch store products
    res_prods = client.get(f"/api/public/stores/{store.slug}/products")
    assert res_prods.status_code == 200
    prods_data = res_prods.json()
    assert len(prods_data) == 1
    p_item = prods_data[0]
    assert p_item["title"] == "Traditional Ajrakh Shawl"
    assert p_item["slug"] == "traditional-ajrakh-shawl"

    # Fetch product detail
    res_detail = client.get(f"/api/public/stores/{store.slug}/products/{p_item['slug']}")
    assert res_detail.status_code == 200
    detail_data = res_detail.json()
    assert detail_data["title"] == "Traditional Ajrakh Shawl"

def test_hidden_product_not_exposed(db_session, client: TestClient):
    artisan = Artisan(name="Deepak", phone="9876500000", location="Varanasi", state="Uttar Pradesh", craft_type="Banarasi Weaving")
    db_session.add(artisan)
    db_session.commit()

    store = ensure_artisan_store(artisan.id, db_session)

    product = Product(artisan_id=artisan.id, title="Banarasi Silk Saree", craft_type="Banarasi Weaving")
    db_session.add(product)
    db_session.commit()

    sp = add_product_to_store(store.id, product.id, db_session)
    sp.is_public = False
    db_session.commit()

    res = client.get(f"/api/public/stores/{store.slug}/products")
    assert res.status_code == 200
    assert len(res.json()) == 0

def test_qr_code_generation(db_session, client: TestClient):
    from app.core.security import create_access_token
    artisan = Artisan(name="Lakshmi", phone="9876511111", location="Tanjore", state="Tamil Nadu", craft_type="Tanjore Painting")
    db_session.add(artisan)
    db_session.commit()

    store = ensure_artisan_store(artisan.id, db_session)

    target_url = get_store_url(store.slug)
    assert target_url == f"http://localhost:3000/store/{store.slug}"

    qr_bytes = generate_qr_code_bytes(target_url)
    assert len(qr_bytes) > 0

    # Login to get token (QR generation requires auth)
    login_res = client.post("/api/auth/verify-otp", json={"phone": "9876511111", "otp": "123456"})
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get(f"/api/stores/{store.id}/qr", headers=headers)
    assert res.status_code == 200
    qr_res = res.json()
    assert "qr_code_path" in qr_res
    assert qr_res["slug"] == store.slug

def test_enquiry_flow(db_session, client: TestClient):
    artisan = Artisan(name="Ramesh", phone="9876543210", location="Palghar", state="Maharashtra", craft_type="Warli Art")
    db_session.add(artisan)
    db_session.commit()

    store = ensure_artisan_store(artisan.id, db_session)
    product = Product(artisan_id=artisan.id, title="Warli Painting", craft_type="Warli Art")
    db_session.add(product)
    db_session.commit()
    add_product_to_store(store.id, product.id, db_session)

    # Login to get token (enquiries endpoints require auth)
    login_res = client.post("/api/auth/verify-otp", json={"phone": "9876543210", "otp": "123456"})
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Valid enquiry
    enquiry_payload = {
        "product_id": str(product.id),
        "visitor_name": "Priya Sharma",
        "visitor_contact": "priya@example.com",
        "message": "Interested in ordering 10 pieces for corporate gifts."
    }
    res = client.post(f"/api/public/products/{product.id}/enquiry", json=enquiry_payload)
    assert res.status_code == 201
    assert res.json()["success"] is True

    # Enquiry persistence in database
    enquiries_db = db_session.query(Enquiry).filter(Enquiry.product_id == product.id).all()
    assert len(enquiries_db) == 1
    assert enquiries_db[0].visitor_name == "Priya Sharma"
    assert enquiries_db[0].status == "new"

    # Artisan enquiry endpoint (requires auth)
    res_artisan_enqs = client.get(f"/api/enquiries/artisan/{artisan.id}", headers=headers)
    assert res_artisan_enqs.status_code == 200
    artisan_enqs = res_artisan_enqs.json()
    assert len(artisan_enqs) == 1
    assert artisan_enqs[0]["product_title"] == "Warli Painting"

    # Update enquiry status to contacted (requires auth)
    enq_id = artisan_enqs[0]["id"]
    res_update = client.patch(f"/api/enquiries/{enq_id}/status", json={"status": "contacted"}, headers=headers)
    assert res_update.status_code == 200
    assert res_update.json()["status"] == "contacted"

def test_enquiry_validation_and_invalid_payload(db_session, client: TestClient):
    invalid_uuid = str(uuid4())
    # Missing product
    res = client.post(f"/api/public/products/{invalid_uuid}/enquiry", json={
        "product_id": invalid_uuid,
        "message": "Hello"
    })
    assert res.status_code == 404

    # Empty message
    artisan = Artisan(name="Test", phone="9000000000", location="Loc", state="State", craft_type="Craft")
    db_session.add(artisan)
    db_session.commit()
    store = ensure_artisan_store(artisan.id, db_session)
    product = Product(artisan_id=artisan.id, title="Test Prod", craft_type="Craft")
    db_session.add(product)
    db_session.commit()
    add_product_to_store(store.id, product.id, db_session)

    res_empty = client.post(f"/api/public/products/{product.id}/enquiry", json={
        "product_id": str(product.id),
        "message": "   "
    })
    assert res_empty.status_code == 400

def test_security_no_sensitive_fields_exposed(db_session, client: TestClient):
    artisan = Artisan(name="Ramesh", phone="9876543210", email="ramesh.private@example.com", location="Palghar", state="Maharashtra", craft_type="Warli Art")
    db_session.add(artisan)
    db_session.commit()

    store = ensure_artisan_store(artisan.id, db_session)

    res = client.get(f"/api/public/stores/{store.slug}")
    assert res.status_code == 200
    data = res.json()
    # Check phone and email are NOT exposed in public endpoint
    assert "phone" not in data
    assert "email" not in data
    assert "XAI_API_KEY" not in str(data)
