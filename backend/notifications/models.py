from django.conf import settings
from django.db import models


class Trigger(models.Model):
    """
    Represents an event that can cause notifications to be sent.
    """

    name = models.CharField(max_length=100)

    event_key = models.CharField(
        max_length=100,
        unique=True,
    )

    description = models.TextField(
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "triggers"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class NotificationTemplate(models.Model):
    """
    Stores the message template for a trigger and channel.
    """

    class Channel(models.TextChoices):
        WHATSAPP = "WHATSAPP", "WhatsApp"
        EMAIL = "EMAIL", "Email"
        WEB_PUSH = "WEB_PUSH", "Web Push"

    trigger = models.ForeignKey(
        Trigger,
        on_delete=models.CASCADE,
        related_name="templates",
    )

    channel = models.CharField(
        max_length=20,
        choices=Channel.choices,
    )

    title = models.CharField(
        max_length=255,
        blank=True,
    )

    subject = models.CharField(
        max_length=255,
        blank=True,
    )

    body = models.TextField()

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "notification_templates"
        ordering = ["-created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["trigger", "channel"],
                name="unique_trigger_channel_template",
            )
        ]

    def __str__(self):
        return f"{self.trigger.name} - {self.channel}"


class VariableMapping(models.Model):
    """
    Stores dynamic variables used by a notification template.

    Example:
        {{user_name}} -> "Abhishek"
    """

    template = models.ForeignKey(
        NotificationTemplate,
        on_delete=models.CASCADE,
        related_name="variables",
    )

    variable_name = models.CharField(
        max_length=100,
    )

    variable_value = models.CharField(
        max_length=500,
    )

    class Meta:
        db_table = "notification_variable_mappings"

        constraints = [
            models.UniqueConstraint(
                fields=["template", "variable_name"],
                name="unique_template_variable",
            )
        ]

    def __str__(self):
        return self.variable_name


class PushSubscription(models.Model):
    """
    Stores a browser's Web Push subscription.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="push_subscriptions",
    )

    endpoint = models.URLField(
        unique=True,
    )

    subscription = models.JSONField()

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "push_subscriptions"

    def __str__(self):
        return f"Push subscription - {self.user}"


class NotificationLog(models.Model):
    """
    Records the result of a notification delivery attempt.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SENT = "SENT", "Sent"
        FAILED = "FAILED", "Failed"

    trigger = models.ForeignKey(
        Trigger,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notification_logs",
    )

    template = models.ForeignKey(
        NotificationTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notification_logs",
    )

    channel = models.CharField(
        max_length=20,
        choices=NotificationTemplate.Channel.choices,
    )

    recipient = models.CharField(
        max_length=255,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    provider_message_id = models.CharField(
        max_length=255,
        blank=True,
    )

    error_message = models.TextField(
        blank=True,
    )

    sent_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "notification_logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.channel} - {self.status}"