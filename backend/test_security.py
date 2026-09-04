from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)


# =========================================================
# Test Password Hashing
# =========================================================

password = "Test@12345"

hashed_password = hash_password(password)

print("\nPassword hash:")
print(hashed_password)


# =========================================================
# Test Password Verification
# =========================================================

is_valid = verify_password(
    password,
    hashed_password,
)

print("\nPassword verification:")
print(is_valid)


# =========================================================
# Test Wrong Password
# =========================================================

wrong_password = "WrongPassword"

is_wrong_password = verify_password(
    wrong_password,
    hashed_password,
)

print("\nWrong password verification:")
print(is_wrong_password)


# =========================================================
# Test JWT Creation
# =========================================================

token = create_access_token(
    user_id=1,
    role="customer",
)

print("\nJWT token:")
print(token)


# =========================================================
# Test JWT Decoding
# =========================================================

payload = decode_access_token(token)

print("\nDecoded JWT:")
print(payload)