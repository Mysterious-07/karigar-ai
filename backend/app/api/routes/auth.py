from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Any
from uuid import UUID

from app.db.database import get_db
from app.db.models.artisan import Artisan
from app.schemas.artisan import ArtisanResponse
from app.core.security import generate_and_store_otp, verify_otp_code, create_access_token, normalize_phone
from app.api.deps import get_current_artisan

router = APIRouter(prefix="/auth", tags=["Auth"])

class SendOtpRequest(BaseModel):
    phone: str

class SendOtpResponse(BaseModel):
    message: str
    phone: str
    demo_mode: bool
    dev_otp: Optional[str] = None

class VerifyOtpRequest(BaseModel):
    phone: str
    otp: str

class VerifyOtpResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    is_new_user: bool
    artisan: ArtisanResponse

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    state: Optional[str] = None
    craft_type: Optional[str] = None
    language: Optional[str] = None
    bio: Optional[str] = None
    email: Optional[str] = None

@router.post("/send-otp", response_model=SendOtpResponse)
def send_otp(body: SendOtpRequest):
    if not body.phone or len(normalize_phone(body.phone)) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid 10-digit mobile number."
        )

    res = generate_and_store_otp(body.phone)
    return SendOtpResponse(
        message="OTP sent successfully",
        phone=res["phone"],
        demo_mode=True,
        dev_otp=res["otp"]
    )

@router.post("/verify-otp", response_model=VerifyOtpResponse)
def verify_otp(body: VerifyOtpRequest, db: Session = Depends(get_db)):
    clean_phone = normalize_phone(body.phone)
    if len(clean_phone) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid mobile number."
        )

    is_valid = verify_otp_code(clean_phone, body.otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP. Please try again with demo OTP: 123456"
        )

    # Check if artisan exists
    artisan = db.query(Artisan).filter(
        (Artisan.phone == clean_phone) | (Artisan.phone == body.phone)
    ).first()

    # Fallback check for Ramesh demo user if logging in with demo phone
    if not artisan and clean_phone == "9876543210":
        artisan = db.query(Artisan).filter(Artisan.name == "Ramesh").first()
        if artisan:
            artisan.phone = "9876543210"
            db.commit()

    is_new_user = False
    if not artisan:
        is_new_user = True
        artisan = Artisan(
            name="Artisan",
            phone=clean_phone,
            location="",
            state="India",
            language="mr",
            craft_type="Handicrafts",
            bio=""
        )
        db.add(artisan)
        db.commit()
        db.refresh(artisan)
    elif not artisan.name or artisan.name.strip() == "Artisan":
        is_new_user = True

    token = create_access_token({"sub": str(artisan.id)})

    return VerifyOtpResponse(
        token=token,
        token_type="bearer",
        is_new_user=is_new_user,
        artisan=artisan
    )

@router.get("/me", response_model=ArtisanResponse)
def get_me(current_artisan: Artisan = Depends(get_current_artisan)):
    return current_artisan

@router.put("/profile", response_model=ArtisanResponse)
def update_profile(
    body: ProfileUpdateRequest,
    current_artisan: Artisan = Depends(get_current_artisan),
    db: Session = Depends(get_db)
):
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(current_artisan, field, value)

    db.commit()
    db.refresh(current_artisan)
    return current_artisan

@router.post("/logout")
def logout():
    """Logout endpoint.
    
    Since the JWT implementation uses stateless tokens, logout is handled
    client-side by discarding the token. This endpoint is provided for
    API completeness. In a production system with refresh tokens, this
    would invalidate the refresh token server-side.
    """
    return {"message": "Logged out successfully. Please discard your authentication token."}
