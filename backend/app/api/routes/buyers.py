from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.database import get_db
from app.db.models.buyer import Buyer
from app.schemas.buyer import BuyerCreate, BuyerResponse

router = APIRouter(prefix="/buyers", tags=["Buyers"])

@router.post("", response_model=BuyerResponse, status_code=status.HTTP_201_CREATED)
def create_buyer(buyer_in: BuyerCreate, db: Session = Depends(get_db)):
    buyer = Buyer(**buyer_in.model_dump())
    db.add(buyer)
    db.commit()
    db.refresh(buyer)
    return buyer

@router.get("/{buyer_id}", response_model=BuyerResponse)
def get_buyer(buyer_id: UUID, db: Session = Depends(get_db)):
    buyer = db.query(Buyer).filter(Buyer.id == buyer_id).first()
    if not buyer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Buyer with id {buyer_id} not found"
        )
    return buyer
