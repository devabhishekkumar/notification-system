import json
import uuid
from pathlib import Path

from django.conf import settings
from pywebpush import webpush, WebPushException

from .base import NotificationProvider


class WebPushProvider(NotificationProvider):
    """
    Web Push notification provider using pywebpush.

    Supports:
    - Local development using private_key.pem
    - Production/Render using VAPID_PRIVATE_KEY environment variable
    """

    def send(
        self,
        recipient,
        title: str = "",
        subject: str = "",
        body: str = "",
    ) -> dict:

        # ====================================================
        # VAPID CONFIGURATION
        # ====================================================

        private_key = getattr(
            settings,
            "VAPID_PRIVATE_KEY",
            "",
        )

        private_key_file = getattr(
            settings,
            "VAPID_PRIVATE_KEY_FILE",
            "",
        )

        claims_email = getattr(
            settings,
            "VAPID_CLAIMS_EMAIL",
            "",
        )

        if not claims_email:
            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    "VAPID_CLAIMS_EMAIL is not configured."
                ),
            }

        # ====================================================
        # PRIVATE KEY
        # ====================================================

        vapid_private_key = None

        # Production / Render
        if private_key:
            vapid_private_key = private_key

        # Local development
        elif private_key_file:
            private_key_path = (
                Path(settings.BASE_DIR) / private_key_file
            )

            if not private_key_path.exists():
                return {
                    "success": False,
                    "provider_message_id": None,
                    "error": (
                        "VAPID private key file not found: "
                        f"{private_key_path}"
                    ),
                }

            vapid_private_key = str(private_key_path)

        else:
            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    "VAPID private key is not configured."
                ),
            }

        # ====================================================
        # PARSE SUBSCRIPTION
        # ====================================================

        try:
            if isinstance(recipient, str):
                subscription = json.loads(recipient)

            elif isinstance(recipient, dict):
                subscription = recipient

            else:
                return {
                    "success": False,
                    "provider_message_id": None,
                    "error": (
                        "Push subscription must be "
                        "a dictionary or JSON string."
                    ),
                }

        except json.JSONDecodeError as exc:
            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    f"Invalid push subscription JSON: {exc}"
                ),
            }

        # ====================================================
        # VALIDATE SUBSCRIPTION
        # ====================================================

        if not isinstance(subscription, dict):
            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    "Push subscription must be "
                    "a JSON object."
                ),
            }

        endpoint = subscription.get("endpoint")

        if not endpoint:
            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    "Push subscription endpoint is missing."
                ),
            }

        keys = subscription.get("keys")

        if not isinstance(keys, dict):
            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    "Push subscription keys are missing."
                ),
            }

        p256dh = keys.get("p256dh")
        auth = keys.get("auth")

        if not p256dh:
            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    "Push subscription p256dh key is missing."
                ),
            }

        if not auth:
            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    "Push subscription auth key is missing."
                ),
            }

        # ====================================================
        # PAYLOAD
        # ====================================================

        payload = {
            "title": title or "Notification",
            "body": body or "",
        }

        # ====================================================
        # VAPID CLAIMS
        # ====================================================

        vapid_claims = {
            "sub": claims_email,
        }

        # ====================================================
        # SEND WEB PUSH
        # ====================================================

        try:
            webpush(
                subscription_info=subscription,
                data=json.dumps(payload),
                vapid_private_key=vapid_private_key,
                vapid_claims=vapid_claims,
            )

            return {
                "success": True,
                "provider_message_id": (
                    f"web-push-{uuid.uuid4()}"
                ),
                "error": None,
            }

        except WebPushException as exc:
            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    f"Web Push provider error: {exc}"
                ),
            }

        except ValueError as exc:
            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    f"Invalid Web Push/VAPID configuration: {exc}"
                ),
            }

        except Exception as exc:
            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    f"Web Push error: {exc}"
                ),
            }