import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_otp_email(
    recipient_email: str,
    otp: str,
) -> None:

    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        raise RuntimeError(
            "SMTP email configuration is missing"
        )

    message = EmailMessage()

    message["Subject"] = "Lumora Email Verification OTP"
    message["From"] = (
        f"{settings.SMTP_FROM_NAME} "
        f"<{settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME}>"
    )
    message["To"] = recipient_email

    message.set_content(
        f"""
Hello,

Your Lumora email verification OTP is:

{otp}

This OTP will expire in 10 minutes.

If you did not create a Lumora account, you can safely ignore this email.

Regards,
Lumora Team
""".strip()
    )

    with smtplib.SMTP(
        settings.SMTP_HOST,
        settings.SMTP_PORT,
    ) as server:

        server.starttls()

        server.login(
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD,
        )

        server.send_message(message)