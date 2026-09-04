from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ServiceCategory(Base):
    __tablename__ = "service_categories"

    # ---------------------------------------------------------
    # Primary Key
    # ---------------------------------------------------------

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    # ---------------------------------------------------------
    # Category Information
    # ---------------------------------------------------------

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    # ---------------------------------------------------------
    # Salon
    # ---------------------------------------------------------
    # Categories belong to a salon.
    # This allows different salons to have different categories.

    salon_id: Mapped[int] = mapped_column(
        ForeignKey("salons.id"),
        nullable=False,
        index=True,
    )

    salon = relationship(
        "Salon",
        back_populates="service_categories",
    )

    # ---------------------------------------------------------
    # Status
    # ---------------------------------------------------------

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # ---------------------------------------------------------
    # Created At
    # ---------------------------------------------------------

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # ---------------------------------------------------------
    # Services
    # ---------------------------------------------------------

    services = relationship(
        "Service",
        back_populates="category",
    )