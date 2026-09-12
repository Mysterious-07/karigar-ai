"""
Phase 6B: Artisan Authentication and Data Security Tests
"""
import uuid
import pytest
from app.db.models.artisan import Artisan
from app.db.models.product import Product
from app.db.models.store import Store
from app.db.models.enquiry import Enquiry
from app.core.security import create_access_token, DEMO_OTP

def _signup(artisan_data: dict, client, db_session):
    return client.post("/api/artisans", json=artisan_data)

def _login(client, phone: str):
    res = client.post("/api/auth/verify-otp", json={"phone": phone, "otp": DEMO_OTP})
    assert res.status_code == 200
    return res.json()["token"]

def _get_auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}

def _create_artisan_and_login(phone: str, name: str, client, db_session):
    _signup({
        "name": name, "phone": phone, "location": "Mumbai",
        "state": "Maharashtra", "language": "hi", "craft_type": "Test Craft"
    }, client, db_session)
    return _login(client, phone)

# ===== 1. Signup/Onboarding =====

def test_signup_onboarding(client, db_session):
    """Test artisan signup/onboarding creates a new artisan."""
    response = client.post("/api/artisans", json={
        "name": "Test Artisan", "phone": "9000000001",
        "location": "Mumbai", "state": "Maharashtra",
        "language": "hi", "craft_type": "Terracotta Pottery"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Artisan"
    assert data["phone"] == "9000000001"
    assert "id" in data

# ===== 2. Valid Login =====

def test_valid_login(client, db_session):
    """Test valid login with demo OTP."""
    _signup({
        "name": "Login Test Artisan", "phone": "9000000003",
        "location": "Mumbai", "state": "Maharashtra",
        "language": "hi", "craft_type": "Jewelry"
    }, client, db_session)
    response = client.post("/api/auth/verify-otp", json={
        "phone": "9000000003", "otp": DEMO_OTP
    })
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["artisan"]["phone"] == "9000000003"

def test_login_returns_demo_mode_indicator(client, db_session):
    """Verify that login response includes demo_mode indicator."""
    _signup({
        "name": "Demo Mode Artisan", "phone": "9000000004",
        "location": "Mumbai", "state": "Maharashtra",
        "language": "hi", "craft_type": "Pottery"
    }, client, db_session)
    otp_res = client.post("/api/auth/send-otp", json={"phone": "9000000004"})
    assert otp_res.status_code == 200
    otp_data = otp_res.json()
    assert otp_data["demo_mode"] is True
    assert "dev_otp" in otp_data

# ===== 3. Invalid OTP =====

def test_invalid_otp(client, db_session):
    """Test login fails with invalid OTP."""
    _signup({
        "name": "Invalid OTP Artisan", "phone": "9000000005",
        "location": "Mumbai", "state": "Maharashtra",
        "language": "hi", "craft_type": "Wood"
    }, client, db_session)
    response = client.post("/api/auth/verify-otp", json={
        "phone": "9000000005", "otp": "999999"
    })
    assert response.status_code == 400
    assert "Invalid or expired OTP" in response.json()["detail"]

# ===== 4. Protected Endpoints without Authentication =====

def test_protected_endpoints_without_token(client, db_session):
    """Test that protected endpoints reject requests without auth."""
    assert client.get("/api/products/me").status_code == 401
    assert client.post("/api/products", json={"title": "T", "craft_type": "T"}).status_code == 401
    assert client.get("/api/stores/me").status_code == 401
    assert client.post("/api/stores", json={"store_name": "T"}).status_code == 401
    assert client.get("/api/enquiries/me").status_code == 401

def test_invalid_token_rejected(client, db_session):
    """Test that invalid tokens are rejected."""
    headers = {"Authorization": "Bearer invalid.token.here"}
    assert client.get("/api/products/me", headers=headers).status_code == 401

# ===== 8. Artisan A cannot access Artisan B enquiry =====

def test_artisan_a_cannot_access_artisan_b_enquiry(client, db_session):
    token_a = _create_artisan_and_login("9610000001", "Enq A", client, db_session)
    token_b = _create_artisan_and_login("9610000002", "Enq B", client, db_session)
    prod_b = client.post("/api/products", json={"title": "PB", "craft_type": "C", "price": 200.0},
                         headers=_get_auth_headers(token_b))
    pid = prod_b.json()["id"]
    client.post("/api/stores", json={"store_name": "S"}, headers=_get_auth_headers(token_b))
    enq = client.post(f"/api/public/products/{pid}/enquiry",
                      json={"visitor_name": "V", "message": "Interested!"})
    assert enq.status_code == 201
    res_b = client.get("/api/enquiries/me", headers=_get_auth_headers(token_b))
    eid = res_b.json()[0]["id"]
    res_a = client.get("/api/enquiries/me", headers=_get_auth_headers(token_a))
    eids = [e["id"] for e in res_a.json()]
    assert eid not in eids
    upd = client.patch(f"/api/enquiries/{eid}/status", json={"status": "resolved"},
                       headers=_get_auth_headers(token_a))
    assert upd.status_code == 403

def test_artisan_can_view_own_enquiries(client, db_session):
    token = _create_artisan_and_login("9710000001", "Own Enq", client, db_session)
    prod = client.post("/api/products", json={"title": "PA", "craft_type": "C", "price": 100.0},
                       headers=_get_auth_headers(token))
    pid = prod.json()["id"]
    client.post(f"/api/public/products/{pid}/enquiry",
                json={"visitor_name": "V", "message": "Test"})
    res = client.get("/api/enquiries/me", headers=_get_auth_headers(token))
    assert res.status_code == 200
    assert len(res.json()) == 1

# ===== 9. Logout =====

def test_logout_endpoint(client, db_session):
    token = _create_artisan_and_login("9810000001", "Logout User", client, db_session)
    res = client.post("/api/auth/logout", headers=_get_auth_headers(token))
    assert res.status_code == 200
    assert "message" in res.json()

# ===== 10. Public Store Access =====

def test_public_store_accessible(client, db_session):
    token = _create_artisan_and_login("9910000001", "Pub Store", client, db_session)
    # Get the auto-created store
    store = client.get("/api/stores/me", headers=_get_auth_headers(token))
    assert store.status_code == 200
    slug = store.json()["slug"]
    store_name = store.json()["store_name"]
    # Access public store
    res = client.get(f"/api/public/stores/{slug}")
    assert res.status_code == 200
    assert res.json()["store_name"] == store_name

def test_private_store_not_accessible(client, db_session):
    token = _create_artisan_and_login("9910000002", "Priv Store", client, db_session)
    store = client.post("/api/stores", json={"store_name": "Private Store"},
                        headers=_get_auth_headers(token))
    sid = store.json()["id"]
    client.patch(f"/api/stores/{sid}", json={"is_public": False}, headers=_get_auth_headers(token))
    slug = store.json()["slug"]
    res = client.get(f"/api/public/stores/{slug}")
    assert res.status_code == 404

# ===== 11. Public Product & Enquiry =====

def test_public_product_accessible(client, db_session):
    token = _create_artisan_and_login("9910000003", "Pub Prod", client, db_session)
    prod = client.post("/api/products", json={"title": "Pub Prod", "craft_type": "C", "price": 500.0},
                       headers=_get_auth_headers(token))
    pid = prod.json()["id"]
    res = client.get(f"/api/products/{pid}")
    assert res.status_code == 200
    assert res.json()["title"] == "Pub Prod"

def test_public_enquiry_submission(client, db_session):
    token = _create_artisan_and_login("9910000004", "Pub Enq", client, db_session)
    prod = client.post("/api/products", json={"title": "Enq Prod", "craft_type": "C", "price": 500.0},
                       headers=_get_auth_headers(token))
    pid = prod.json()["id"]
    res = client.post(f"/api/public/products/{pid}/enquiry",
                      json={"visitor_name": "Buyer", "message": "Interested!"})
    assert res.status_code == 201
    assert res.json()["success"] is True

# ===== Additional: Cross-artisan profile protection =====

def test_cannot_update_other_artisan_profile(client, db_session):
    token_a = _create_artisan_and_login("7710000001", "Prof A", client, db_session)
    b_res = client.post("/api/artisans", json={
        "name": "Prof B", "phone": "7710000002", "location": "M",
        "state": "S", "language": "h", "craft_type": "C"
    })
    bid = b_res.json()["id"]
    res = client.put(f"/api/artisans/{bid}", json={"name": "HACKED"},
                     headers=_get_auth_headers(token_a))
    assert res.status_code == 403

def test_product_ignores_frontend_artisan_id(client, db_session):
    token = _create_artisan_and_login("7810000001", "Ignore", client, db_session)
    b_res = client.post("/api/artisans", json={
        "name": "B", "phone": "7810000002", "location": "M",
        "state": "S", "language": "h", "craft_type": "C"
    })
    fake_id = b_res.json()["id"]
    res = client.post("/api/products", json={"artisan_id": fake_id, "title": "T", "craft_type": "C"},
                      headers=_get_auth_headers(token))
    assert res.status_code == 201
    assert res.json()["artisan_id"] != fake_id

def test_jwt_uses_env():
    import os
    import app.core.security as sec
    env = os.getenv("JWT_SECRET_KEY")
    if env:
        assert sec.SECRET_KEY == env
    else:
        assert "demo" in sec.SECRET_KEY.lower()
