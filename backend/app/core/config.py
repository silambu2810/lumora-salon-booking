from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str

    SECRET_KEY: str

    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    APP_NAME: str = "Lumora Salon Booking"

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "Lumora"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()