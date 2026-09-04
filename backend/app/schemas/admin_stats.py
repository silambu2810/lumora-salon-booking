from pydantic import BaseModel


class BookingStatusStats(BaseModel):
    pending: int
    confirmed: int
    completed: int
    cancelled: int


class SalonBookingStats(BaseModel):
    salon_id: int
    salon_name: str
    booking_count: int


class AdminStatsResponse(BaseModel):
    total_customers: int
    total_salon_owners: int
    total_staff: int
    total_admins: int

    total_salons: int
    active_salons: int

    total_services: int
    active_services: int

    total_bookings: int
    booking_status: BookingStatusStats

    total_reviews: int
    average_rating: float | None

    bookings_by_salon: list[SalonBookingStats]