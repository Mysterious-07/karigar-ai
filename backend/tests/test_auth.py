import pytest
from app.db.models.artisan import Artisan
from app.db.models.product import Product
from app.db.models.store import Store
from app.db.models.enquiry import Enquiry

def test_send_otp_success(client):
    response = client.post("/api/auth/send-otp", json={"phone": "9876543210"})
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "OTP sent successfully"
    assert data["dev_otp"] == "123456"
    assert data["demo_mode"] is True

def test_send_otp_invalid_phone(client):
    response = client.post("/api/auth/send-otp", json={"phone": "123"})
    assert response.status_code == 400

def test_verify_otp_invalid_code(client):
    response = client.post("/api/auth/verify-otp", json={"phone": "9876543210", "otp": "999999"})
    assert response.status_code == 400
    assert "Invalid or expired OTP" in response.json()["detail"]

def test_verify_otp_new_user(client, db_session):
    response = client.post("/api/auth/verify-otp", json={"phone": "9112233445", "otp": "123456"})
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["is_new_user"] is True
    assert data["artisan"]["phone"] == "9112233445"

def test_verify_otp_existing_ramesh(client, db_session):
    # Create demo artisan Ramesh
    ramesh = Artisan(
        name="Ramesh",
        phone="9876543210",
        location="Palghar",
        state="Maharashtra",
        language="mr",
        craft_type="Warli Art"
    )
    db_session.add(ramesh)
    db_session.commit()

    response = client.post("/api/auth/verify-otp", json={"phone": "9876543210", "otp": "123456"})
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["is_new_user"] is False
    assert data["artisan"]["name"] == "Ramesh"

def test_protected_routes_without_token(client):
    res1 = client.get("/api/auth/me")
    assert res1.status_code == 401

    res2 = client.get("/api/products/me")
    assert res2.status_code == 401

    res3 = client.get("/api/stores/me")
    assert res3.status_code == 401

    res4 = client.get("/api/enquiries/me")
    assert res4.status_code == 401

def test_authenticated_profile_update(client, db_session):
    # Verify OTP to get token
    login_res = client.post("/api/auth/verify-otp", json={"phone": "9876543210", "otp": "123456"})
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch profile
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200

    # Update profile
    update_res = client.put("/api/auth/profile", json={
        "name": "Suresh Warli",
        "location": "Thane",
        "craft_type": "Warli Painting",
        "language": "hi"
    }, headers=headers)
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["name"] == "Suresh Warli"
    assert updated_data["location"] == "Thane"
    assert updated_data["craft_type"] == "Warli Painting"

def test_artisan_data_isolation(client, db_session):
    # Create Artisan A
    art_a = Artisan(name="Artisan A", phone="9000000001", location="Loc A", state="ST", language="mr", craft_type="Craft A")
    db_session.add(art_a)
    db_session.commit()
    token_a = client.post("/api/auth/verify-otp", json={"phone": "9000000001", "otp": "123456"}).json()["token"]

    # Create Artisan B
    art_b = Artisan(name="Artisan B", phone="9000000002", location="Loc B", state="ST", language="hi", craft_type="Craft B")
    db_session.add(art_b)
    db_session.commit()
    token_b = client.post("/api/auth/verify-otp", json={"phone": "9000000002", "otp": "123456"}).json()["token"]

    # Create product for Artisan A
    prod_a = Product(artisan_id=art_a.id, title="Prod A", craft_type="Craft A", price=100.0)
    db_session.add(prod_a)
    db_session.commit()

    # Create product for Artisan B
    prod_b = Product(artisan_id=art_b.id, title="Prod B", craft_type="Craft B", price=200.0)
    db_session.add(prod_b)
    db_session.commit()

    # Fetch Artisan A products with Token A
    res_a = client.get("/api/products/me", headers={"Authorization": f"Bearer {token_a}"})
    assert res_a.status_code == 200
    prods_a = res_a.json()
    assert len(prods_a) == 1
    assert prods_a[0]["title"] == "Prod A"

    # Fetch Artisan B products with Token B
    res_b = client.get("/api/products/me", headers={"Authorization": f"Bearer {token_b}"})
    assert res_b.status_code == 200
    prods_b = res_b.json()
    assert len(prods_b) == 1
    assert prods_b[0]["title"] == "Prod B"

def test_public_storefront_accessible_without_token(client, db_session):
    artisan = Artisan(name="Public Artisan", phone="9998887776", location="Loc", state="ST", language="mr", craft_type="Terracotta")
    db_session.add(artisan)
    db_session.commit()

    store = Store(artisan_id=artisan.id, store_name="Public Store", slug="public-store", is_public=True)
    db_session.add(store)
    db_session.commit()

    # Access without auth token
    res = client.get("/api/public/stores/public-store")
    assert res.status_code == 200
    assert res.json()["store_name"] == "Public Store"
