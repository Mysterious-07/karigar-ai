from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class ArtisanBase(BaseModel):
    name: str
    phone: str
    email: str | None = None
    location: str
    state: str
    language: str = "Hindi"
    craft_type: str
    profile_image: str | None = None
    bio: str | None = None

class ArtisanCreate(ArtisanBase):
    pass

class ArtisanUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    location: str | None = None
    state: str | None = None
    language: str | None = None
    craft_type: str | None = None
    profile_image: str | None = None
    bio: str | None = None

class ArtisanResponse(ArtisanBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
