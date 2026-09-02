from notifications.models import NotificationLog


def create_notification_log(
    notification: dict,
    recipient: str,
) -> NotificationLog:
    """
    Create a PENDING notification delivery log.
    """

    return NotificationLog.objects.create(
        trigger_id=notification["trigger_id"],
        template_id=notification["template_id"],
        channel=notification["channel"],
        recipient=recipient,
        status=NotificationLog.Status.PENDING,
    )