from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.database import get_db
from app.db.models.artisan import Artisan
from app.schemas.artisan import ArtisanCreate, ArtisanUpdate, ArtisanResponse
from app.api.deps import get_current_artisan, get_optional_artisan

router = APIRouter(prefix="/artisans", tags=["Artisans"])

@router.get("/me", response_model=ArtisanResponse)
def get_my_profile(current_artisan: Artisan = Depends(get_current_artisan)):
    return current_artisan

@router.post("", response_model=ArtisanResponse, status_code=status.HTTP_201_CREATED)
def create_artisan(artisan_in: ArtisanCreate, db: Session = Depends(get_db)):
    """Create a new artisan (signup/onboarding)."""
    artisan = Artisan(**artisan_in.model_dump())
    db.add(artisan)
    db.commit()
    db.refresh(artisan)

    # Auto create digital store for artisan
    try:
        from app.services.store_service import ensure_artisan_store
        ensure_artisan_store(artisan.id, db)
    except Exception:
        pass

    return artisan

@router.get("/{artisan_id}", response_model=ArtisanResponse)
def get_artisan(artisan_id: UUID, current_artisan: Artisan | None = Depends(get_optional_artisan), db: Session = Depends(get_db)):
    """Get artisan profile by ID. 
    If the requester is the artisan themselves, full profile is returned.
    Otherwise, only public profile info is returned (no phone number).
    """
    artisan = db.query(Artisan).filter(Artisan.id == artisan_id).first()
    if not artisan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Artisan with id {artisan_id} not found"
        )
    # Non-owners shouldn't see the phone number
    if current_artisan is None or current_artisan.id != artisan_id:
        artisan.phone = "********"  # Mask phone for non-owners
    return artisan

@router.put("/{artisan_id}", response_model=ArtisanResponse)
def update_artisan(
    artisan_id: UUID,
    artisan_in: ArtisanUpdate,
    current_artisan: Artisan = Depends(get_current_artisan),
    db: Session = Depends(get_db)
):
    """Update artisan profile. Only the artisan owner can modify their own profile."""
    if current_artisan.id != artisan_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this artisan profile"
        )
    
    artisan = db.query(Artisan).filter(Artisan.id == artisan_id).first()
    if not artisan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Artisan with id {artisan_id} not found"
        )
    
    update_data = artisan_in.model_dump(exclude_unset=True)
    # Prevent phone from being changed (would break authentication)
    update_data.pop("phone", None)
    
    for field, value in update_data.items():
        setattr(artisan, field, value)
        
    db.commit()
    db.refresh(artisan)
    return artisan
