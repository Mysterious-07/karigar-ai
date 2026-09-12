import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Buyer(Base):
    __tablename__ = "buyers"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    buyer_type: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. Home Decor Store, Hotel, Boutique, Corporate Gifting
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)  # State/region of the buyer
    requirements: Mapped[str | None] = mapped_column(Text, nullable=True)
    min_order_quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Phase 3 Matching Fields
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    preferred_crafts: Mapped[str | None] = mapped_column(Text, nullable=True) # Comma-separated list
    preferred_categories: Mapped[str | None] = mapped_column(Text, nullable=True) # Comma-separated list
    budget_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    budget_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    bulk_order_interest: Mapped[str | None] = mapped_column(String(50), nullable=True, default="Yes")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    matches = relationship("BuyerMatch", back_populates="buyer", cascade="all, delete-orphan")
