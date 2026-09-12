from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.database import get_db
from app.db.models.artisan import Artisan
from app.db.models.product import Product
from app.schemas.pricing import PricingRequest, PricingResponse
from app.services.pricing_service import pricing_service
from app.services.ai_client import AIClientError
from app.api.deps import get_current_artisan, verify_product_ownership

router = APIRouter(tags=["Pricing"])

@router.post("/products/{product_id}/suggest-price", response_model=PricingResponse)
def suggest_product_price(
    product_id: UUID,
    body: PricingRequest,
    current_artisan: Artisan = Depends(get_current_artisan),
    db: Session = Depends(get_db)
):
    """Generate pricing guidance for a product. Only the product owner can trigger this."""
    product = verify_product_ownership(product_id, current_artisan, db)

    # Calculate price guidance
    try:
        pricing_res: PricingResponse = pricing_service.calculate_price_guidance(db, product, body)
    except AIClientError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI pricing guidance failed. Please try again. ({e.category})"
        )

    # Persist pricing attributes to PostgreSQL
    if body.material_cost is not None:
        product.material_cost = body.material_cost
    if body.labour_cost is not None:
        product.labour_cost = body.labour_cost
    if body.other_cost is not None:
        product.other_cost = body.other_cost

    product.suggested_min_price = pricing_res.suggested_min_price
    product.suggested_max_price = pricing_res.suggested_max_price
    product.suggested_price = pricing_res.suggested_price
    product.pricing_explanation = pricing_res.explanation
    product.pricing_confidence = pricing_res.confidence

    db.commit()
    db.refresh(product)

    return pricing_res
