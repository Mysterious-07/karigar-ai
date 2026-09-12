from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.database import get_db
from app.db.models.enquiry import Enquiry
from app.db.models.store import Store
from app.db.models.product import Product
from app.schemas.enquiry import EnquiryResponse, EnquiryStatusUpdate
from app.db.models.artisan import Artisan
from app.api.deps import get_current_artisan, get_optional_artisan, verify_enquiry_ownership

router = APIRouter(prefix="/enquiries", tags=["Enquiries"])

@router.get("/me", response_model=list[EnquiryResponse])
def get_my_enquiries(current_artisan: Artisan = Depends(get_current_artisan), db: Session = Depends(get_db)):
    return get_artisan_enquiries(artisan_id=current_artisan.id, db=db)

@router.get("/artisan/{artisan_id}", response_model=list[EnquiryResponse])
def get_artisan_enquiries(
    artisan_id: UUID,
    current_artisan: Artisan | None = Depends(get_optional_artisan),
    db: Session = Depends(get_db)
):
    """Get enquiries for an artisan. Only the owner can view their enquiries."""
    if current_artisan is None:
        return []
    
    if current_artisan.id != artisan_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view these enquiries"
        )
    
    store = db.query(Store).filter(Store.artisan_id == artisan_id).first()
    if not store:
        return []
    
    enquiries = db.query(Enquiry).filter(Enquiry.store_id == store.id).order_by(Enquiry.created_at.desc()).all()
    
    result: list[EnquiryResponse] = []
    for enq in enquiries:
        product = db.query(Product).filter(Product.id == enq.product_id).first()
        res = EnquiryResponse(
            id=enq.id,
            product_id=enq.product_id,
            store_id=enq.store_id,
            visitor_name=enq.visitor_name,
            visitor_contact=enq.visitor_contact,
            message=enq.message,
            status=enq.status,
            created_at=enq.created_at,
            product_title=product.title if product else "Unknown Product",
            product_image=product.processed_image or product.original_image if product else None
        )
        result.append(res)
    
    return result

@router.patch("/{enquiry_id}/status", response_model=EnquiryResponse)
def update_enquiry_status(
    enquiry_id: UUID,
    status_in: EnquiryStatusUpdate,
    current_artisan: Artisan = Depends(get_current_artisan),
    db: Session = Depends(get_db)
):
    """Update enquiry status. Only the enquiry owner can modify it."""
    enquiry = verify_enquiry_ownership(enquiry_id, current_artisan, db)
    
    enquiry.status = status_in.status
    db.commit()
    db.refresh(enquiry)
    
    product = db.query(Product).filter(Product.id == enquiry.product_id).first()
    return EnquiryResponse(
        id=enquiry.id,
        product_id=enquiry.product_id,
        store_id=enquiry.store_id,
        visitor_name=enquiry.visitor_name,
        visitor_contact=enquiry.visitor_contact,
        message=enquiry.message,
        status=enquiry.status,
        created_at=enquiry.created_at,
        product_title=product.title if product else "Unknown Product",
        product_image=product.processed_image or product.original_image if product else None
    )

def get_artisan_enquiries(artisan_id: UUID, db: Session = Depends(get_db)) -> list[EnquiryResponse]:
    """Helper function to get enquiries for an artisan (used by /me endpoint)."""
    store = db.query(Store).filter(Store.artisan_id == artisan_id).first()
    if not store:
        return []
    
    enquiries = db.query(Enquiry).filter(Enquiry.store_id == store.id).order_by(Enquiry.created_at.desc()).all()
    
    result: list[EnquiryResponse] = []
    for enq in enquiries:
        product = db.query(Product).filter(Product.id == enq.product_id).first()
        res = EnquiryResponse(
            id=enq.id,
            product_id=enq.product_id,
            store_id=enq.store_id,
            visitor_name=enq.visitor_name,
            visitor_contact=enq.visitor_contact,
            message=enq.message,
            status=enq.status,
            created_at=enq.created_at,
            product_title=product.title if product else "Unknown Product",
            product_image=product.processed_image or product.original_image if product else None
        )
        result.append(res)
    
    return result
