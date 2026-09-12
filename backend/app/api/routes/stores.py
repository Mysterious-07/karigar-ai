from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.database import get_db
from app.db.models.store import Store, StoreProduct
from app.db.models.artisan import Artisan
from app.db.models.product import Product
from app.schemas.store import StoreCreate, StoreUpdate, StoreResponse, StoreProductToggle
from app.services.store_service import ensure_artisan_store, generate_store_slug, add_product_to_store
from app.services.qr_service import save_store_qr_code, get_store_url
from app.api.deps import get_current_artisan, verify_store_ownership, verify_product_ownership

router = APIRouter(prefix="/stores", tags=["Stores"])

@router.get("/me", response_model=StoreResponse)
def get_my_store(current_artisan: Artisan = Depends(get_current_artisan), db: Session = Depends(get_db)):
    return ensure_artisan_store(current_artisan.id, db)

@router.post("", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
def create_store(
    store_in: StoreCreate,
    current_artisan: Artisan = Depends(get_current_artisan),
    db: Session = Depends(get_db)
):
    """Create a store for the authenticated artisan."""
    artisan_id = current_artisan.id
    existing = db.query(Store).filter(Store.artisan_id == artisan_id).first()
    if existing:
        return existing
    
    artisan = db.query(Artisan).filter(Artisan.id == artisan_id).first()
    if not artisan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artisan not found")
    
    store_name = store_in.store_name or f"{artisan.name}s Digital Store"
    slug = store_in.slug or generate_store_slug(artisan.name, artisan.craft_type, db)
    
    store = Store(
        artisan_id=artisan_id,
        store_name=store_name,
        slug=slug,
        description=store_in.description or f"Handcrafted {artisan.craft_type} by {artisan.name} from {artisan.location}, {artisan.state}.",
        is_public=True,
    )
    db.add(store)
    db.commit()
    db.refresh(store)
    return store

@router.get("/{store_id}", response_model=StoreResponse)
def get_store(store_id: UUID, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
    return store

@router.patch("/{store_id}", response_model=StoreResponse)
def update_store(
    store_id: UUID,
    store_update: StoreUpdate,
    current_artisan: Artisan = Depends(get_current_artisan),
    db: Session = Depends(get_db)
):
    """Update a store. Only the store owner can modify it."""
    store = verify_store_ownership(store_id, current_artisan, db)
    update_data = store_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(store, field, value)
    db.commit()
    db.refresh(store)
    return store

@router.patch("/{store_id}/products/{product_id}")
def toggle_store_product_visibility(
    store_id: UUID,
    product_id: UUID,
    toggle_in: StoreProductToggle,
    current_artisan: Artisan = Depends(get_current_artisan),
    db: Session = Depends(get_db)
):
    """Toggle product visibility. Only store owner can modify."""
    store = verify_store_ownership(store_id, current_artisan, db)
    product = verify_product_ownership(product_id, current_artisan, db)
    store_product = add_product_to_store(store_id, product_id, db)
    store_product.is_public = toggle_in.is_public
    db.commit()
    db.refresh(store_product)
    return {"success": True, "store_id": str(store_id), "product_id": str(product_id), "is_public": store_product.is_public}

@router.get("/{store_id}/qr")
def get_store_qr(
    store_id: UUID,
    current_artisan: Artisan = Depends(get_current_artisan),
    db: Session = Depends(get_db)
):
    """Get store QR code. Only store owner can access."""
    store = verify_store_ownership(store_id, current_artisan, db)
    qr_path = save_store_qr_code(store.slug)
    store.qr_code_path = qr_path
    db.commit()
    db.refresh(store)
    return {"store_id": str(store.id), "slug": store.slug, "store_url": get_store_url(store.slug), "qr_code_path": qr_path}
