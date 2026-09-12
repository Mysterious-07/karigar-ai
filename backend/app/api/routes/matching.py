from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.db.database import get_db
from app.db.models.artisan import Artisan
from app.db.models.product import Product
from app.schemas.match import BuyerMatchResponse, MatchStatusUpdateResponse
from app.services.matching_service import matching_service
from app.api.deps import get_current_artisan, verify_product_ownership

router = APIRouter(tags=["Buyer Matching"])

@router.post("/products/{product_id}/match-buyers", response_model=List[BuyerMatchResponse])
def match_buyers_for_product(
    product_id: UUID,
    language: str = Query(default="en"),
    current_artisan: Artisan = Depends(get_current_artisan),
    db: Session = Depends(get_db)
):
    """Generate buyer matches for a product. Only the product owner can trigger this."""
    product = verify_product_ownership(product_id, current_artisan, db)
    
    return matching_service.match_product_to_buyers(db, product_id, language)

@router.get("/products/{product_id}/matches", response_model=List[BuyerMatchResponse])
def get_product_buyer_matches(
    product_id: UUID,
    current_artisan: Artisan = Depends(get_current_artisan),
    db: Session = Depends(get_db)
):
    """Get buyer matches for a product. Only the product owner can view."""
    product = verify_product_ownership(product_id, current_artisan, db)
    
    matches = matching_service.get_saved_matches(db, product_id)
    if not matches:
        # Generate matches if none previously exist
        matches = matching_service.match_product_to_buyers(db, product_id)
    return matches

@router.post("/products/{product_id}/matches/{match_id}/interest", response_model=MatchStatusUpdateResponse)
def record_buyer_interest(
    product_id: UUID,
    match_id: UUID,
    current_artisan: Artisan = Depends(get_current_artisan),
    db: Session = Depends(get_db)
):
    """Record buyer interest for a match. Only the product owner can do this."""
    verify_product_ownership(product_id, current_artisan, db)
    
    match_obj = matching_service.update_match_status(db, match_id, "contacted")
    return MatchStatusUpdateResponse(
        success=True,
        match_id=match_id,
        status="contacted",
        message="Interest request recorded."
    )
