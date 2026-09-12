from pydantic import BaseModel, Field
from typing import List, Optional

class PricingRequest(BaseModel):
    material_cost: Optional[float] = Field(default=None, ge=0, description="Cost of raw materials in INR")
    labour_cost: Optional[float] = Field(default=None, ge=0, description="Artisan labour cost in INR")
    other_cost: Optional[float] = Field(default=None, ge=0, description="Packaging, tools, or electricity cost")
    production_time: Optional[str] = Field(default=None, description="Time taken to produce item")
    current_price: Optional[float] = Field(default=None, ge=0, description="Current selling price if any")
    quantity: int = Field(default=1, ge=1, description="Quantity for order pricing calculation")
    language: str = Field(default="en", description="Output language: en, hi, or mr")

class PricingResponse(BaseModel):
    suggested_min_price: float
    suggested_max_price: float
    suggested_price: float
    currency: str = "₹"
    confidence: str = "Medium"
    explanation: str
    factors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
