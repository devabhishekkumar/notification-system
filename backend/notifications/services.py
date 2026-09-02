import json
import uuid
from pathlib import Path

import requests
from django.conf import settings
from pywebpush import webpush, WebPushException
from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client

from .base import NotificationProvider


class EmailProvider(NotificationProvider):
    """
    Brevo transactional email provider.
    """

    BREVO_URL = "https://api.brevo.com/v3/smtp/email"

    def send(
        self,
        recipient: str,
        title: str = "",
        subject: str = "",
        body: str = "",
    ) -> dict:
        api_key = getattr(settings, "BREVO_API_KEY", "")
        from_email = getattr(settings, "BREVO_FROM_EMAIL", "")
        from_name = getattr(
            settings,
            "BREVO_FROM_NAME",
            "Notification System",
        )

        if not api_key:
            return {
                "success": False,
                "provider_message_id": None,
                "error": "BREVO_API_KEY is not configured.",
            }

        if not from_email:
            return {
                "success": False,
                "provider_message_id": None,
                "error": "BREVO_FROM_EMAIL is not configured.",
            }

        payload = {
            "sender": {
                "name": from_name,
                "email": from_email,
            },
            "to": [{"email": recipient}],
            "subject": subject or title or "Notification",
            "textContent": body,
        }

        headers = {
            "accept": "application/json",
            "api-key": api_key,
            "content-type": "application/json",
        }

        try:
            response = requests.post(
                self.BREVO_URL,
                json=payload,
                headers=headers,
                timeout=15,
            )

            if response.ok:
                data = response.json()
                return {
                    "success": True,
                    "provider_message_id": data.get("messageId"),
                    "error": None,
                }

            try:
                error_data = response.json()
                error_message = (
                    error_data.get("message")
                    or error_data.get("code")
                    or response.text
                )
            except ValueError:
                error_message = response.text

            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    f"Brevo {response.status_code}: "
                    f"{error_message}"
                ),
            }

        except requests.RequestException as exc:
            return {
                "success": False,
                "provider_message_id": None,
                "error": str(exc),
            }


class WebPushProvider(NotificationProvider):
    """
    Web Push notification provider using pywebpush.
    """

    def send(
        self,
        recipient,
        title: str = "",
        subject: str = "",
        body: str = "",
    ) -> dict:
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

        if not private_key_file:
            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    "VAPID_PRIVATE_KEY_FILE is not configured."
                ),
            }

        if not claims_email:
            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    "VAPID_CLAIMS_EMAIL is not configured."
                ),
            }

        private_key_path = (
            Path(settings.BASE_DIR) / private_key_file
        )

        if not private_key_path.exists():
            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    f"VAPID private key file not found: "
                    f"{private_key_path}"
                ),
            }

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
                        "Push subscription must be a dictionary "
                        "or JSON string."
                    ),
                }

        except json.JSONDecodeError as exc:
            return {
                "success": False,
                "provider_message_id": None,
                "error": f"Invalid push subscription JSON: {exc}",
            }

        if not isinstance(subscription, dict):
            return {
                "success": False,
                "provider_message_id": None,
                "error": "Push subscription must be a JSON object.",
            }

        endpoint = subscription.get("endpoint")
        if not endpoint:
            return {
                "success": False,
                "provider_message_id": None,
                "error": "Push subscription endpoint is missing.",
            }

        keys = subscription.get("keys")
        if not isinstance(keys, dict):
            return {
                "success": False,
                "provider_message_id": None,
                "error": "Push subscription keys are missing.",
            }

        p256dh = keys.get("p256dh")
        auth = keys.get("auth")

        if not p256dh:
            return {
                "success": False,
                "provider_message_id": None,
                "error": "Push subscription p256dh key is missing.",
            }

        if not auth:
            return {
                "success": False,
                "provider_message_id": None,
                "error": "Push subscription auth key is missing.",
            }

        payload = {
            "title": title or "Notification",
            "body": body or "",
        }

        vapid_claims = {
            "sub": claims_email,
        }

        try:
            webpush(
                subscription_info=subscription,
                data=json.dumps(payload),
                vapid_private_key=str(private_key_path),
                vapid_claims=vapid_claims,
            )

            return {
                "success": True,
                "provider_message_id": f"web-push-{uuid.uuid4()}",
                "error": None,
            }

        except WebPushException as exc:
            return {
                "success": False,
                "provider_message_id": None,
                "error": f"Web Push provider error: {exc}",
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
                "error": f"Web Push error: {exc}",
            }


class WhatsAppProvider(NotificationProvider):
    """
    WhatsApp notification provider using Twilio WhatsApp Sandbox.
    """

    def send(
        self,
        recipient: str,
        title: str = "",
        subject: str = "",
        body: str = "",
    ) -> dict:
        account_sid = getattr(
            settings,
            "TWILIO_ACCOUNT_SID",
            "",
        )
        auth_token = getattr(
            settings,
            "TWILIO_AUTH_TOKEN",
            "",
        )
        from_number = getattr(
            settings,
            "TWILIO_WHATSAPP_FROM",
            "",
        )
        content_sid = getattr(
            settings,
            "TWILIO_WHATSAPP_CONTENT_SID",
            "",
        )

        if not account_sid:
            return {
                "success": False,
                "provider_message_id": None,
                "error": "TWILIO_ACCOUNT_SID is not configured.",
            }

        if not auth_token:
            return {
                "success": False,
                "provider_message_id": None,
                "error": "TWILIO_AUTH_TOKEN is not configured.",
            }

        if not from_number:
            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    "TWILIO_WHATSAPP_FROM is not configured."
                ),
            }

        if not content_sid:
            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    "TWILIO_WHATSAPP_CONTENT_SID "
                    "is not configured."
                ),
            }

        if not recipient:
            return {
                "success": False,
                "provider_message_id": None,
                "error": "WhatsApp recipient is required.",
            }

        recipient = str(recipient).strip()

        if not recipient.startswith("whatsapp:"):
            recipient = f"whatsapp:{recipient}"

        if not from_number.startswith("whatsapp:"):
            from_number = f"whatsapp:{from_number}"

        try:
            client = Client(
                account_sid,
                auth_token,
            )

            message = client.messages.create(
                from_=from_number,
                to=recipient,
                content_sid=content_sid,
            )

            return {
                "success": True,
                "provider_message_id": message.sid,
                "error": None,
            }

        except TwilioRestException as exc:
            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    f"Twilio error "
                    f"{exc.status}: {exc.msg}"
                ),
            }

        except Exception as exc:
            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    f"WhatsApp provider error: {exc}"
                ),
            }
