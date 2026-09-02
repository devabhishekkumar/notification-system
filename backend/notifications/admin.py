from django.contrib import admin

from .models import (
    NotificationLog,
    NotificationTemplate,
    PushSubscription,
    Trigger,
    VariableMapping,
)


@admin.register(Trigger)
class TriggerAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "event_key",
        "is_active",
        "created_at",
    )

    list_filter = (
        "is_active",
    )

    search_fields = (
        "name",
        "event_key",
    )


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "trigger",
        "channel",
        "is_active",
        "created_at",
        "updated_at",
    )

    list_filter = (
        "channel",
        "is_active",
    )

    search_fields = (
        "trigger__name",
        "body",
        "subject",
    )


@admin.register(VariableMapping)
class VariableMappingAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "template",
        "variable_name",
        "variable_value",
    )

    search_fields = (
        "variable_name",
        "variable_value",
    )


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "endpoint",
        "is_active",
        "created_at",
    )

    list_filter = (
        "is_active",
    )

    search_fields = (
        "user__username",
        "endpoint",
    )


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "trigger",
        "channel",
        "recipient",
        "status",
        "sent_at",
        "created_at",
    )

    list_filter = (
        "channel",
        "status",
    )

    search_fields = (
        "recipient",
        "provider_message_id",
        "error_message",
    )

    readonly_fields = (
        "created_at",
        "sent_at",
    )