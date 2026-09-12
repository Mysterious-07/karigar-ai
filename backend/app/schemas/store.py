from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class StoreBase(BaseModel):
    artisan_id: UUID
    store_name: str
    slug: str
    description: str | None = None
    qr_code_path: str | None = None
    is_public: bool = True

class StoreCreate(BaseModel):
    artisan_id: UUID | None = None  # Ignored by backend, derived from authenticated user
    store_name: str | None = None
    slug: str | None = None
    description: str | None = None

class StoreUpdate(BaseModel):
    store_name: str | None = None
    description: str | None = None
    is_public: bool | None = None

class StoreProductToggle(BaseModel):
    is_public: bool

class StoreResponse(StoreBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PublicProductItem(BaseModel):
    id: UUID
    slug: str
    title: str
    description: str | None = None
    category: str | None = None
    craft_type: str
    material: str | None = None
    dimensions: str | None = None
    production_time: str | None = None
    price: float | None = None
    suggested_min_price: float | None = None
    suggested_max_price: float | None = None
    suggested_price: float | None = None
    original_image: str | None = None
    processed_image: str | None = None
    artisan_story: str | None = None
    tags: list[str] = []
    is_public: bool = True

    model_config = ConfigDict(from_attributes=True)

class PublicStoreResponse(BaseModel):
    id: UUID
    store_name: str
    slug: str
    description: str | None = None
    qr_code_path: str | None = None
    is_public: bool
    artisan_name: str
    craft_type: str
    location: str
    state: str
    bio: str | None = None
    profile_image: str | None = None
    products: list[PublicProductItem] = []

    model_config = ConfigDict(from_attributes=True)
