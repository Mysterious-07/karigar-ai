from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, List

class BuyerMatchBase(BaseModel):
    product_id: UUID
    buyer_id: UUID
    match_score: float
    reason: Optional[str] = None
    status: str = "suggested"

class BuyerMatchCreate(BuyerMatchBase):
    pass

class BuyerMatchResponse(BaseModel):
    id: UUID
    product_id: UUID
    buyer_id: UUID
    business_name: str
    buyer_type: str
    location: str
    state: Optional[str] = None
    buyer_label: str = "Potential Buyer"
    match_score: float
    reason: str
    factors_breakdown: List[str] = []
    budget_range: str
    bulk_order_interest: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MatchStatusUpdateResponse(BaseModel):
    success: bool
    match_id: UUID
    status: str
    message: str