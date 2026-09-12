from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class BuyerBase(BaseModel):
    business_name: str
    buyer_type: str
    location: str
    requirements: str | None = None
    min_order_quantity: int | None = None

class BuyerCreate(BuyerBase):
    pass

class BuyerResponse(BuyerBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
