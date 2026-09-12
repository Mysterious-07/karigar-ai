import os
import json
import hmac
import hashlib
import base64
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "karigar_secret_key_sih_2026_demo_key_998877")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = int(os.getenv("TOKEN_EXPIRE_DAYS", "30"))
DEMO_OTP = os.getenv("DEMO_OTP", "123456")

# In-memory store for OTPs: phone -> { "otp": str, "expires_at": datetime }
_otp_store: Dict[str, Dict[str, Any]] = {}

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def _base64url_decode(data_str: str) -> bytes:
    padding = '=' * (4 - (len(data_str) % 4))
    return base64.urlsafe_b64decode(data_str + padding)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)

    to_encode.update({
        "exp": int(expire.timestamp()),
        "iat": int(now.timestamp())
    })

    header = {"alg": ALGORITHM, "typ": "JWT"}
    
    header_b64 = _base64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    payload_b64 = _base64url_encode(json.dumps(to_encode, separators=(',', ':')).encode('utf-8'))
    
    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    signature_b64 = _base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"

def decode_access_token(token: str) -> Optional[dict]:
    try:
        parts = token.strip().split('.')
        if len(parts) != 3:
            return None

        header_b64, payload_b64, signature_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')

        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
        actual_sig = _base64url_decode(signature_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload_bytes = _base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode('utf-8'))

        exp = payload.get("exp")
        if exp and int(datetime.now(timezone.utc).timestamp()) > exp:
            return None

        return payload
    except Exception:
        return None

def normalize_phone(phone: str) -> str:
    cleaned = ''.join(c for c in phone if c.isdigit())
    if len(cleaned) > 10:
        cleaned = cleaned[-10:]
    return cleaned

def generate_and_store_otp(phone: str) -> dict:
    clean_phone = normalize_phone(phone)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Store demo OTP for MVP
    _otp_store[clean_phone] = {
        "otp": DEMO_OTP,
        "expires_at": expires_at
    }

    return {
        "phone": clean_phone,
        "otp": DEMO_OTP,
        "demo_mode": True,
        "message": f"Demo OTP is {DEMO_OTP}"
    }

def verify_otp_code(phone: str, otp: str) -> bool:
    clean_phone = normalize_phone(phone)
    otp = otp.strip()

    # Allow universal demo OTP 123456
    if otp == DEMO_OTP:
        return True

    record = _otp_store.get(clean_phone)
    if not record:
        return False

    if datetime.now(timezone.utc) > record["expires_at"]:
        del _otp_store[clean_phone]
        return False

    if record["otp"] == otp:
        del _otp_store[clean_phone]
        return True

    return False
