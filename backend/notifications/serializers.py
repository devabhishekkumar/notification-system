from rest_framework import serializers

from .models import (
    NotificationLog,
    NotificationTemplate,
    PushSubscription,
    Trigger,
    VariableMapping,
)


# ============================================================
# TRIGGER SERIALIZER
# ============================================================

class TriggerSerializer(serializers.ModelSerializer):

    class Meta:
        model = Trigger

        fields = [
            "id",
            "name",
            "event_key",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


# ============================================================
# VARIABLE MAPPING SERIALIZER
# ============================================================

class VariableMappingSerializer(serializers.ModelSerializer):

    class Meta:
        model = VariableMapping

        fields = [
            "id",
            "variable_name",
            "variable_value",
        ]

        read_only_fields = [
            "id",
        ]

    def validate_variable_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Variable name is required."
            )

        return value

    def validate_variable_value(self, value):
        if isinstance(value, str):
            return value.strip()

        return value


# ============================================================
# NOTIFICATION TEMPLATE SERIALIZER
# ============================================================

class NotificationTemplateSerializer(
    serializers.ModelSerializer
):

    # Trigger display name
    trigger_name = serializers.CharField(
        source="trigger.name",
        read_only=True,
    )

    # Return variables inside template response
    variables = VariableMappingSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = NotificationTemplate

        fields = [
            "id",
            "trigger",
            "trigger_name",
            "channel",
            "title",
            "subject",
            "body",
            "is_active",
            "variables",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "trigger_name",
            "variables",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):

        # --------------------------------------------------------
        # GET CURRENT / NEW VALUES
        # --------------------------------------------------------

        trigger = attrs.get(
            "trigger",
            getattr(
                self.instance,
                "trigger",
                None,
            ),
        )

        channel = attrs.get(
            "channel",
            getattr(
                self.instance,
                "channel",
                None,
            ),
        )

        title = attrs.get(
            "title",
            getattr(
                self.instance,
                "title",
                "",
            ),
        )

        subject = attrs.get(
            "subject",
            getattr(
                self.instance,
                "subject",
                "",
            ),
        )

        body = attrs.get(
            "body",
            getattr(
                self.instance,
                "body",
                "",
            ),
        )

        # --------------------------------------------------------
        # TRIGGER VALIDATION
        # --------------------------------------------------------

        if trigger and not trigger.is_active:
            raise serializers.ValidationError({
                "trigger": (
                    "Cannot create or update a template "
                    "for an inactive trigger."
                )
            })

        # --------------------------------------------------------
        # BODY VALIDATION
        # --------------------------------------------------------

        if not body or not body.strip():
            raise serializers.ValidationError({
                "body": "Message body is required."
            })

        # --------------------------------------------------------
        # EMAIL VALIDATION
        # --------------------------------------------------------

        if (
            channel
            == NotificationTemplate.Channel.EMAIL
        ):

            if not subject or not subject.strip():
                raise serializers.ValidationError({
                    "subject": (
                        "Subject is required "
                        "for email templates."
                    )
                })

        # --------------------------------------------------------
        # WEB PUSH VALIDATION
        # --------------------------------------------------------

        if (
            channel
            == NotificationTemplate.Channel.WEB_PUSH
        ):

            if not title or not title.strip():
                raise serializers.ValidationError({
                    "title": (
                        "Title is required "
                        "for web push templates."
                    )
                })

        # --------------------------------------------------------
        # DUPLICATE TEMPLATE VALIDATION
        # --------------------------------------------------------

        if trigger and channel:

            existing = (
                NotificationTemplate.objects
                .filter(
                    trigger=trigger,
                    channel=channel,
                )
            )

            # Exclude current template while editing
            if self.instance:
                existing = existing.exclude(
                    pk=self.instance.pk
                )

            if existing.exists():
                raise serializers.ValidationError({
                    "channel": (
                        "A template for this trigger "
                        "and channel already exists."
                    )
                })

        return attrs


# ============================================================
# WEB PUSH SUBSCRIPTION SERIALIZER
# ============================================================

class PushSubscriptionSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = PushSubscription

        fields = [
            "id",
            "endpoint",
            "subscription",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):

        # --------------------------------------------------------
        # GET VALUES
        # --------------------------------------------------------

        endpoint = attrs.get(
            "endpoint",
            getattr(
                self.instance,
                "endpoint",
                None,
            ),
        )

        subscription = attrs.get(
            "subscription",
            getattr(
                self.instance,
                "subscription",
                None,
            ),
        )

        # --------------------------------------------------------
        # ENDPOINT REQUIRED
        # --------------------------------------------------------

        if not endpoint:
            raise serializers.ValidationError({
                "endpoint": (
                    "Push subscription endpoint "
                    "is required."
                )
            })

        if not isinstance(endpoint, str):
            raise serializers.ValidationError({
                "endpoint": (
                    "Endpoint must be a valid string."
                )
            })

        endpoint = endpoint.strip()

        if not endpoint:
            raise serializers.ValidationError({
                "endpoint": (
                    "Push subscription endpoint "
                    "cannot be empty."
                )
            })

        # --------------------------------------------------------
        # SUBSCRIPTION OBJECT
        # --------------------------------------------------------

        if not isinstance(subscription, dict):
            raise serializers.ValidationError({
                "subscription": (
                    "Subscription must be "
                    "a JSON object."
                )
            })

        # --------------------------------------------------------
        # SUBSCRIPTION ENDPOINT
        # --------------------------------------------------------

        subscription_endpoint = (
            subscription.get("endpoint")
        )

        if not subscription_endpoint:
            raise serializers.ValidationError({
                "subscription": (
                    "Subscription endpoint "
                    "is required."
                )
            })

        if not isinstance(
            subscription_endpoint,
            str,
        ):
            raise serializers.ValidationError({
                "subscription": (
                    "Subscription endpoint "
                    "must be a string."
                )
            })

        subscription_endpoint = (
            subscription_endpoint.strip()
        )

        # --------------------------------------------------------
        # ENDPOINT MUST MATCH
        # --------------------------------------------------------

        if subscription_endpoint != endpoint:
            raise serializers.ValidationError({
                "subscription": (
                    "Subscription endpoint does not "
                    "match the endpoint field."
                )
            })

        # --------------------------------------------------------
        # KEYS
        # --------------------------------------------------------

        keys = subscription.get("keys")

        if not isinstance(keys, dict):
            raise serializers.ValidationError({
                "subscription": (
                    "Subscription keys "
                    "are required."
                )
            })

        # --------------------------------------------------------
        # P256DH
        # --------------------------------------------------------

        p256dh = keys.get("p256dh")

        if not p256dh:
            raise serializers.ValidationError({
                "subscription": (
                    "p256dh key is required."
                )
            })

        if not isinstance(p256dh, str):
            raise serializers.ValidationError({
                "subscription": (
                    "p256dh key must be a string."
                )
            })

        # --------------------------------------------------------
        # AUTH
        # --------------------------------------------------------

        auth = keys.get("auth")

        if not auth:
            raise serializers.ValidationError({
                "subscription": (
                    "auth key is required."
                )
            })

        if not isinstance(auth, str):
            raise serializers.ValidationError({
                "subscription": (
                    "auth key must be a string."
                )
            })

        # --------------------------------------------------------
        # CURRENT USER
        # --------------------------------------------------------

        request = self.context.get("request")

        user = None

        if (
            request
            and request.user
            and request.user.is_authenticated
        ):
            user = request.user

        # --------------------------------------------------------
        # DUPLICATE ENDPOINT FOR SAME USER
        # --------------------------------------------------------

        if user:

            existing = (
                PushSubscription.objects
                .filter(
                    user=user,
                    endpoint=endpoint,
                )
            )

            if self.instance:
                existing = existing.exclude(
                    pk=self.instance.pk
                )

            if existing.exists():
                raise serializers.ValidationError({
                    "endpoint": (
                        "This push subscription is "
                        "already registered."
                    )
                })

        # --------------------------------------------------------
        # CLEAN VALUES
        # --------------------------------------------------------

        attrs["endpoint"] = endpoint

        subscription["endpoint"] = endpoint

        attrs["subscription"] = subscription

        return attrs


# ============================================================
# NOTIFICATION LOG SERIALIZER
# ============================================================

class NotificationLogSerializer(
    serializers.ModelSerializer
):

    # Trigger name
    trigger_name = serializers.CharField(
        source="trigger.name",
        read_only=True,
    )

    # Template title
    template_title = serializers.CharField(
        source="template.title",
        read_only=True,
    )

    # Email subject
    template_subject = serializers.CharField(
        source="template.subject",
        read_only=True,
    )

    # Template body
    template_body = serializers.CharField(
        source="template.body",
        read_only=True,
    )

    class Meta:
        model = NotificationLog

        fields = [
            "id",
            "trigger",
            "trigger_name",
            "template",
            "channel",
            "recipient",
            "status",
            "provider_message_id",
            "error_message",
            "sent_at",
            "created_at",

            # Template information
            "template_title",
            "template_subject",
            "template_body",
        ]

        read_only_fields = [
            "id",
            "trigger_name",
            "template_title",
            "template_subject",
            "template_body",
            "status",
            "provider_message_id",
            "error_message",
            "sent_at",
            "created_at",
        ]