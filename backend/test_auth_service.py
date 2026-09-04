from app.core.database import SessionLocal
from app.services.auth import register_user, login_user
from app.schemas.auth import RegisterRequest, LoginRequest


# =========================================================
# Create Database Session
# =========================================================

db = SessionLocal()


try:

    # =====================================================
    # Register
    # =====================================================

    register_data = RegisterRequest(
        name="Test Customer",
        email="testcustomer@example.com",
        phone="9876543210",
        password="Test@12345",
    )

    try:
        user = register_user(
            db,
            register_data,
        )

        print("\nUser registered successfully!")
        print("ID:", user.id)
        print("Name:", user.name)
        print("Email:", user.email)
        print("Role:", user.role)

    except ValueError as error:
        print("\nRegistration:", error)

    # =====================================================
    # Login
    # =====================================================

    login_data = LoginRequest(
        email="testcustomer@example.com",
        password="Test@12345",
    )

    try:
        token, user = login_user(
            db,
            login_data,
        )

        print("\nLogin successful!")
        print("User ID:", user.id)
        print("Role:", user.role)
        print("Access Token:")
        print(token)

    except ValueError as error:
        print("\nLogin:", error)


finally:

    db.close()