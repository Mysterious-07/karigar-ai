from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class EnquiryCreate(BaseModel):
    product_id: UUID | None = None  # Optional - can be derived from URL path
    visitor_name: str | None = None
    visitor_contact: str | None = None
    message: str

class EnquiryStatusUpdate(BaseModel):
    status: str

class EnquiryResponse(BaseModel):
    id: UUID
    product_id: UUID
    store_id: UUID
    visitor_name: str | None = None
    visitor_contact: str | None = None
    message: str
    status: str
    created_at: datetime
    product_title: str | None = None
    product_image: str | None = None

    model_config = ConfigDict(from_attributes=True)
