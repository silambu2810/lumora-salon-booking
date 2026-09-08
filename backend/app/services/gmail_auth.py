import base64
import os
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow


BASE_DIR = Path(__file__).resolve().parents[2]

CREDENTIALS_FILE = BASE_DIR / "gmail_credentials.json"
TOKEN_FILE = BASE_DIR / "gmail_token.json"

SCOPES = [
    "https://www.googleapis.com/auth/gmail.send"
]


def get_gmail_credentials():
    credentials = None

    # Render: load token from environment variable
    token_base64 = os.getenv("GMAIL_TOKEN_BASE64")

    if token_base64:
        token_json = base64.b64decode(token_base64).decode("utf-8")
        credentials = Credentials.from_authorized_user_info(
            __import__("json").loads(token_json),
            SCOPES,
        )

    # Local: load token from file
    elif TOKEN_FILE.exists():
        credentials = Credentials.from_authorized_user_file(
            str(TOKEN_FILE),
            SCOPES,
        )

    if credentials and credentials.valid:
        return credentials

    if credentials and credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())

        # Save refreshed token locally only when running locally
        if not token_base64:
            TOKEN_FILE.write_text(
                credentials.to_json(),
                encoding="utf-8",
            )

        return credentials

    # Only perform browser OAuth locally
    if not CREDENTIALS_FILE.exists():
        raise RuntimeError(
            "Gmail OAuth credentials are not configured"
        )

    flow = InstalledAppFlow.from_client_secrets_file(
        str(CREDENTIALS_FILE),
        SCOPES,
    )

    credentials = flow.run_local_server(port=0)

    TOKEN_FILE.write_text(
        credentials.to_json(),
        encoding="utf-8",
    )

    return credentials