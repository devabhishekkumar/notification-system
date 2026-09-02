import requests

from django.conf import settings

from .base import NotificationProvider


class EmailProvider(NotificationProvider):
    """
    Brevo transactional email provider.
    """

    BREVO_URL = "https://api.brevo.com/v3/smtp/email"

    def send(
        self,
        recipient: str,
        title: str,
        subject: str,
        body: str,
    ) -> dict:

        api_key = getattr(
            settings,
            "BREVO_API_KEY",
            "",
        )

        from_email = getattr(
            settings,
            "BREVO_FROM_EMAIL",
            "",
        )

        from_name = getattr(
            settings,
            "BREVO_FROM_NAME",
            "Notification System",
        )

        # ====================================================
        # CHECK BREVO CONFIGURATION
        # ====================================================

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

        # ====================================================
        # BREVO REQUEST
        # ====================================================

        payload = {
            "sender": {
                "name": from_name,
                "email": from_email,
            },
            "to": [
                {
                    "email": recipient,
                }
            ],
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

            # -----------------------------------------------
            # SUCCESS
            # -----------------------------------------------

            if response.ok:
                data = response.json()

                return {
                    "success": True,
                    "provider_message_id": data.get(
                        "messageId"
                    ),
                    "error": None,
                }

            # -----------------------------------------------
            # BREVO ERROR
            # -----------------------------------------------

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