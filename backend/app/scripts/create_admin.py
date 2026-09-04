from getpass import getpass

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User


def create_admin() -> None:
    db = SessionLocal()

    try:
        print("=== Lumora Admin Setup ===")

        name = input("Admin name: ").strip()
        email = input("Admin email: ").strip().lower()
        phone = input("Admin phone: ").strip()

        password = getpass("Admin password: ")
        confirm_password = getpass("Confirm password: ")

        if password != confirm_password:
            print("Error: passwords do not match.")
            return

        if len(password) < 8:
            print("Error: password must contain at least 8 characters.")
            return

        existing_email = db.scalar(
            select(User).where(User.email == email)
        )

        if existing_email:
            print("Error: email already exists.")
            return

        existing_phone = db.scalar(
            select(User).where(User.phone == phone)
        )

        if existing_phone:
            print("Error: phone number already exists.")
            return

        admin = User(
            name=name,
            email=email,
            phone=phone,
            password_hash=hash_password(password),
            role="admin",
            is_email_verified=True,
            is_active=True,
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print()
        print("Admin created successfully.")
        print(f"Admin ID: {admin.id}")
        print(f"Name: {admin.name}")
        print(f"Email: {admin.email}")
        print(f"Role: {admin.role}")

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()