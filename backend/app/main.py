from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# =========================================================
# ROUTERS
# =========================================================

from app.routers.auth import router as auth_router
from app.routers.salon import router as salon_router
from app.routers.service import router as service_router
from app.routers.booking import router as booking_router
from app.routers.admin import router as admin_router
from app.routers.staff_booking import router as staff_booking_router
from app.routers.owner import router as owner_router
from app.routers.otp import router as otp_router
from app.routers.availability import router as availability_router
from app.routers.admin_booking import router as admin_booking_router

from app.routers.review import (
    router as review_router,
    admin_router as admin_review_router,
)

from app.routers.admin_stats import router as admin_stats_router

from app.routers.admin_customer import (
    router as admin_customer_router,
)

from app.routers.service_category import (
    router as service_category_router,
)

from app.routers.admin_staff import (
    router as admin_staff_router,
)


# =========================================================
# APPLICATION
# =========================================================

app = FastAPI(
    title="Lumora API",
    description="Salon & Beauty Booking Platform API",
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # React / Vite
        "http://localhost:5173",
        "http://127.0.0.1:5173",

        # Expo Web
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROUTER REGISTRATION
# =========================================================


# ---------------------------------------------------------
# Authentication
# ---------------------------------------------------------

app.include_router(auth_router)


# ---------------------------------------------------------
# Public salon discovery
# ---------------------------------------------------------

app.include_router(salon_router)


# ---------------------------------------------------------
# Services
# ---------------------------------------------------------

app.include_router(service_router)


# ---------------------------------------------------------
# Admin core
# ---------------------------------------------------------

app.include_router(admin_router)


# ---------------------------------------------------------
# Salon owner
# ---------------------------------------------------------

app.include_router(owner_router)


# ---------------------------------------------------------
# Customer bookings
# ---------------------------------------------------------

app.include_router(booking_router)


# ---------------------------------------------------------
# OTP / email verification
# ---------------------------------------------------------

app.include_router(otp_router)


# ---------------------------------------------------------
# Availability
# ---------------------------------------------------------

app.include_router(availability_router)


# ---------------------------------------------------------
# Staff bookings
# ---------------------------------------------------------

app.include_router(staff_booking_router)


# ---------------------------------------------------------
# Admin booking management
# ---------------------------------------------------------

app.include_router(admin_booking_router)


# ---------------------------------------------------------
# Customer / public reviews
# ---------------------------------------------------------

app.include_router(review_router)


# ---------------------------------------------------------
# Admin review management
# ---------------------------------------------------------

app.include_router(admin_review_router)


# ---------------------------------------------------------
# Admin statistics
# ---------------------------------------------------------

app.include_router(admin_stats_router)


# ---------------------------------------------------------
# Admin customer management
# ---------------------------------------------------------

app.include_router(admin_customer_router)


# ---------------------------------------------------------
# Service categories
# ---------------------------------------------------------

app.include_router(service_category_router)


# ---------------------------------------------------------
# Admin staff management
# ---------------------------------------------------------

app.include_router(admin_staff_router)


# =========================================================
# ROOT ENDPOINT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Welcome to Lumora API",
        "status": "running",
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }