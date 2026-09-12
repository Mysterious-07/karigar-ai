from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class ProductBase(BaseModel):
    title: str
    craft_type: str
    description: str | None = None
    category: str | None = None
    material: str | None = None
    dimensions: str | None = None
    production_time: str | None = None
    price: float | None = None
    original_image: str | None = None

class ProductCreate(ProductBase):
    artisan_id: UUID | None = None  # Ignored by backend, derived from authenticated user

class ProductUpdate(BaseModel):
    title: str | None = None
    craft_type: str | None = None
    description: str | None = None
    category: str | None = None
    material: str | None = None
    dimensions: str | None = None
    production_time: str | None = None
    price: float | None = None
    material_cost: float | None = None
    labour_cost: float | None = None
    other_cost: float | None = None
    suggested_min_price: float | None = None
    suggested_max_price: float | None = None
    suggested_price: float | None = None
    pricing_explanation: str | None = None
    pricing_confidence: str | None = None
    original_image: str | None = None
    processed_image: str | None = None
    artisan_story: str | None = None
    slug: str | None = None
    ai_quality_score: float | None = None
    status: str | None = None
    is_public: bool | None = None

class ProductResponse(ProductBase):
    id: UUID
    artisan_id: UUID
    slug: str | None = None
    material_cost: float | None = None
    labour_cost: float | None = None
    other_cost: float | None = None
    suggested_min_price: float | None = None
    suggested_max_price: float | None = None
    suggested_price: float | None = None
    pricing_explanation: str | None = None
    pricing_confidence: str | None = None
    processed_image: str | None = None
    artisan_story: str | None = None
    ai_quality_score: float | None = None
    status: str
    is_public: bool | None = True
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
