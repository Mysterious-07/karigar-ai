from pydantic import BaseModel, Field
from typing import List, Optional
from app.schemas.product import ProductResponse

class CatalogGenerationRequest(BaseModel):
    description: str = Field(default="", description="Artisan's raw voice/text description (may be empty if image-only with vision model)")
    language: str = Field(default="en", description="Input language: en, hi, or mr (what the artisan spoke/typed)")
    output_language: str = Field(default="en", description="Output language for marketplace catalog: en (default) or hi")

class CatalogGenerationResponse(BaseModel):
    title: str
    description: str
    category: str
    craft_type: str
    material: str = "Not provided"
    dimensions: str = "Not provided"
    production_time: str = "Not provided"
    tags: List[str] = Field(default_factory=list)
    artisan_story: str

class CatalogApiResponse(BaseModel):
    success: bool
    product: ProductResponse
    quality_score: float
    suggestions: List[str] = Field(default_factory=list)