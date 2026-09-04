from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, Time, DateTime, ForeignKey, Text

from app.core.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    salon_id = Column(
        Integer,
        ForeignKey("salons.id"),
        nullable=False
    )

    service_id = Column(
        Integer,
        ForeignKey("services.id"),
        nullable=False
    )

    # Stylist assigned to this booking
    staff_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    booking_date = Column(Date, nullable=False)

    booking_time = Column(Time, nullable=False)

    status = Column(
        String(20),
        nullable=False,
        default="pending"
    )

    notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )