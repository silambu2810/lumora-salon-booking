from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
)


# =========================================================
# Test Register Schema
# =========================================================

register_data = RegisterRequest(
    name="Silambarasan",
    email="siva@example.com",
    phone="9876543210",
    password="Test@12345",
)

print("Register data:")
print(register_data)


# =========================================================
# Test Login Schema
# =========================================================

login_data = LoginRequest(
    email="siva@example.com",
    password="Test@12345",
)

print("\nLogin data:")
print(login_data)


print("\nSchema validation successful!")