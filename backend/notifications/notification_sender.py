from django.utils import timezone

from notifications.models import NotificationLog
from notifications.providers.email import EmailProvider
from notifications.providers.whatsapp import WhatsAppProvider
from notifications.providers.web_push import WebPushProvider


# ============================================================
# PROVIDER
# ============================================================


def get_provider(channel: str):
    """
    Return the provider for a notification channel.
    """

    providers = {
        "EMAIL": EmailProvider,
        "WHATSAPP": WhatsAppProvider,
        "WEB_PUSH": WebPushProvider,
    }

    provider_class = providers.get(channel)

    if provider_class is None:
        raise ValueError(
            f"Unsupported notification channel: {channel}"
        )

    return provider_class()


# ============================================================
# SEND ONE NOTIFICATION
# ============================================================


def send_notification(
    notification: dict,
    recipient,
) -> NotificationLog:
    """
    Create a PENDING log, send the notification through
    the correct provider, then update the log to SENT/FAILED.

    For EMAIL / WHATSAPP:
        recipient is normally a string.

    For WEB_PUSH:
        recipient is the complete browser subscription
        dictionary.
    """

    # --------------------------------------------------------
    # Value stored in NotificationLog.recipient
    # --------------------------------------------------------

    if isinstance(recipient, dict):
        log_recipient = recipient.get(
            "endpoint",
            "web-push-subscription",
        )
    else:
        log_recipient = str(recipient)

    # --------------------------------------------------------
    # Create pending log
    # --------------------------------------------------------

    log = NotificationLog.objects.create(
        trigger_id=notification["trigger_id"],
        template_id=notification["template_id"],
        channel=notification["channel"],
        recipient=log_recipient,
        status=NotificationLog.Status.PENDING,
    )

    # --------------------------------------------------------
    # Send notification
    # --------------------------------------------------------

    try:
        provider = get_provider(
            notification["channel"]
        )

        result = provider.send(
            recipient=recipient,
            title=notification.get("title", ""),
            subject=notification.get("subject", ""),
            body=notification.get("body", ""),
        )

    except Exception as exc:
        result = {
            "success": False,
            "provider_message_id": None,
            "error": str(exc),
        }

    # --------------------------------------------------------
    # Update log
    # --------------------------------------------------------

    if result.get("success"):

        log.status = NotificationLog.Status.SENT

        log.provider_message_id = (
            result.get("provider_message_id")
            or ""
        )

        log.error_message = ""
        log.sent_at = timezone.now()

    else:

        log.status = NotificationLog.Status.FAILED

        log.provider_message_id = ""

        log.error_message = (
            result.get("error")
            or "Notification delivery failed."
        )

        log.sent_at = None

    log.save(
        update_fields=[
            "status",
            "provider_message_id",
            "error_message",
            "sent_at",
        ]
    )

    return log


# ============================================================
# SEND MULTIPLE NOTIFICATIONS
# ============================================================


def send_notifications(
    notifications: list,
    recipients: dict,
) -> list[NotificationLog]:
    """
    Send all dispatched notifications.

    Example:

        recipients = {
            "EMAIL": "abhishekofficial8184@gmail.com",

            "WHATSAPP": "+919876543210",

            "WEB_PUSH": {
                "endpoint": "...",
                "keys": {
                    "p256dh": "...",
                    "auth": "..."
                }
            }
        }

    Channels without a recipient are skipped.
    """

    logs = []

    for notification in notifications:

        channel = notification["channel"]

        recipient = recipients.get(channel)

        # ----------------------------------------------------
        # Skip channel when no recipient exists
        # ----------------------------------------------------

        if not recipient:
            continue

        # ----------------------------------------------------
        # Send
        # ----------------------------------------------------

        log = send_notification(
            notification,
            recipient,
        )

        logs.append(log)

    return logs