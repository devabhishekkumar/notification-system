from .base import *


DEBUG = True


ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
]


CORS_ALLOW_ALL_ORIGINS = True


# ============================================================
# WEB PUSH / VAPID
# ============================================================

VAPID_PRIVATE_KEY = os.getenv(
    "VAPID_PRIVATE_KEY",
    "",
)

VAPID_PUBLIC_KEY = os.getenv(
    "VAPID_PUBLIC_KEY",
    "",
)

VAPID_CLAIMS_EMAIL = os.getenv(
    "VAPID_CLAIMS_EMAIL",
    "",
)