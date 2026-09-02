from notifications.models import (
    NotificationTemplate,
    Trigger,
)

from notifications.template_renderer import render_template


def dispatch_notification(
    event_key: str,
    context: dict,
) -> list[dict]:
    """
    Find an active trigger and its active templates,
    render each template using runtime context,
    and prepare notifications for delivery.

    Provider delivery is handled separately.
    """

    # --------------------------------------------------------
    # Find active trigger
    # --------------------------------------------------------

    try:
        trigger = Trigger.objects.get(
            event_key=event_key,
            is_active=True,
        )
    except Trigger.DoesNotExist:
        return []

    # --------------------------------------------------------
    # Find active templates
    # --------------------------------------------------------

    templates = (
        NotificationTemplate.objects
        .filter(
            trigger=trigger,
            is_active=True,
        )
        .select_related("trigger")
        .prefetch_related("variables")
        .order_by("channel")
    )

    notifications = []

    # --------------------------------------------------------
    # Render each channel
    # --------------------------------------------------------

    for template in templates:

        rendered = render_template(
            template,
            context,
        )

        notifications.append(
            {
                "template_id": template.id,
                "trigger_id": trigger.id,
                "trigger": trigger.event_key,
                "channel": template.channel,
                "title": rendered["title"],
                "subject": rendered["subject"],
                "body": rendered["body"],
            }
        )

    return notifications