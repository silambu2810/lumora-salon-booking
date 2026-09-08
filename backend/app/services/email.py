import base64
from email.message import EmailMessage

from googleapiclient.discovery import build

from app.services.gmail_auth import get_gmail_credentials


def send_otp_email(
    recipient_email: str,
    otp: str,
) -> None:
    credentials = get_gmail_credentials()

    service = build(
        "gmail",
        "v1",
        credentials=credentials,
    )

    message = EmailMessage()

    message["To"] = recipient_email
    message["Subject"] = "Lumora Email Verification OTP"

    message.set_content(
        f"""
Hello,

Your Lumora email verification OTP is:

{otp}

This OTP will expire in 10 minutes.

If you did not create a Lumora account, you can safely ignore this email.

Regards,
Lumora Team
"""
    )

    encoded_message = base64.urlsafe_b64encode(
        message.as_bytes()
    ).decode()

    try:
        service.users().messages().send(
            userId="me",
            body={"raw": encoded_message},
        ).execute()
    except Exception as error:
        raise RuntimeError(
            "Unable to send verification email"
        ) from error