from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models.artisan import Artisan
from app.db.models.product import Product
from app.db.models.store import Store
from app.db.models.enquiry import Enquiry
from app.core.security import decode_access_token

security = HTTPBearer(auto_error=False)

def get_current_artisan(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db)
) -> Artisan:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    artisan_id_str = payload["sub"]
    try:
        artisan_uuid = UUID(artisan_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid artisan identity in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    artisan = db.query(Artisan).filter(Artisan.id == artisan_uuid).first()
    if not artisan:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Artisan user not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return artisan

def get_optional_artisan(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db)
) -> Artisan | None:
    if not credentials or not credentials.credentials:
        return None
    try:
        return get_current_artisan(credentials=credentials, db=db)
    except HTTPException:
        return None


# =============================================================================
# OWNERSHIP VERIFICATION HELPERS
# =============================================================================

def verify_product_ownership(
    product_id: UUID,
    artisan: Artisan,
    db: Session
) -> Product:
    """Verify that the product belongs to the given artisan.
    Raises 404 if product not found, 403 if ownership mismatch.
    Returns the product if ownership is verified.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    if product.artisan_id != artisan.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this product"
        )
    return product


def verify_store_ownership(
    store_id: UUID,
    artisan: Artisan,
    db: Session
) -> Store:
    """Verify that the store belongs to the given artisan.
    Raises 404 if store not found, 403 if ownership mismatch.
    Returns the store if ownership is verified.
    """
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store with id {store_id} not found"
        )
    if store.artisan_id != artisan.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this store"
        )
    return store


def verify_enquiry_ownership(
    enquiry_id: UUID,
    artisan: Artisan,
    db: Session
) -> Enquiry:
    """Verify that the enquiry belongs to the given artisan's store.
    Raises 404 if enquiry not found, 403 if ownership mismatch.
    Returns the enquiry if ownership is verified.
    """
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Enquiry with id {enquiry_id} not found"
        )
    # Check that the enquiry's store belongs to this artisan
    store = db.query(Store).filter(Store.id == enquiry.store_id).first()
    if not store or store.artisan_id != artisan.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this enquiry"
        )
    return enquiry
