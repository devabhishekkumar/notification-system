from django.conf import settings
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from .base import NotificationProvider


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

        # ==========================================================
        # GET CONFIGURATION
        # ==========================================================

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

        # ==========================================================
        # VALIDATION
        # ==========================================================

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
                "error": "TWILIO_WHATSAPP_FROM is not configured.",
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

        # ==========================================================
        # NORMALIZE PHONE NUMBER
        # ==========================================================

        recipient = str(recipient).strip()

        if not recipient.startswith("whatsapp:"):
            recipient = f"whatsapp:{recipient}"

        if not from_number.startswith("whatsapp:"):
            from_number = f"whatsapp:{from_number}"

        # ==========================================================
        # CREATE TWILIO CLIENT
        # ==========================================================

        try:
            client = Client(
                account_sid,
                auth_token,
            )

            # ======================================================
            # SEND WHATSAPP TEMPLATE
            # ======================================================

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

        # ==========================================================
        # TWILIO ERROR
        # ==========================================================

        except TwilioRestException as exc:
            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    f"Twilio error "
                    f"{exc.status}: {exc.msg}"
                ),
            }

        # ==========================================================
        # GENERAL ERROR
        # ==========================================================

        except Exception as exc:
            return {
                "success": False,
                "provider_message_id": None,
                "error": (
                    f"WhatsApp provider error: {exc}"
                ),
            }