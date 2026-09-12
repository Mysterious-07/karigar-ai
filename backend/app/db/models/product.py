import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    artisan_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("artisans.id", ondelete="CASCADE"), nullable=False, index=True)
    original_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    processed_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    craft_type: Mapped[str] = mapped_column(String(100), nullable=False)
    material: Mapped[str | None] = mapped_column(String(100), nullable=True)
    dimensions: Mapped[str | None] = mapped_column(String(100), nullable=True)
    production_time: Mapped[str | None] = mapped_column(String(100), nullable=True)
    price: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    # Phase 3 Pricing fields
    material_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    labour_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    other_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    suggested_min_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    suggested_max_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    suggested_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    pricing_explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    pricing_confidence: Mapped[str | None] = mapped_column(String(50), nullable=True)

    artisan_story: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_transcript: Mapped[str | None] = mapped_column(Text, nullable=True)  # Original voice/text input, stored separately from final description
    slug: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    ai_quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    artisan = relationship("Artisan", back_populates="products")
    tags = relationship("ProductTag", back_populates="product", cascade="all, delete-orphan")
    buyer_matches = relationship("BuyerMatch", back_populates="product", cascade="all, delete-orphan")
    store_products = relationship("StoreProduct", back_populates="product", cascade="all, delete-orphan")
    enquiries = relationship("Enquiry", back_populates="product", cascade="all, delete-orphan")


class ProductTag(Base):
    __tablename__ = "product_tags"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    tag: Mapped[str] = mapped_column(String(100), nullable=False)

    # Relationship
    product = relationship("Product", back_populates="tags")
