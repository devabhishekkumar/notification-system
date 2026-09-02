from django.conf import settings
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import (
    AllowAny,
    IsAdminUser,
    IsAuthenticated,
)
from rest_framework.response import Response

from .models import (
    NotificationLog,
    NotificationTemplate,
    PushSubscription,
    Trigger,
    VariableMapping,
)

from .serializers import (
    NotificationLogSerializer,
    NotificationTemplateSerializer,
    PushSubscriptionSerializer,
    TriggerSerializer,
    VariableMappingSerializer,
)

from .notification_dispatcher import dispatch_notification
from .notification_sender import send_notifications

from .services import (
    EmailProvider,
    WhatsAppProvider,
    WebPushProvider,
)


# ============================================================
# TRIGGER APIs
# ============================================================


class TriggerListCreateView(generics.ListCreateAPIView):
    """
    GET  /triggers/
    POST /triggers/
    """

    queryset = Trigger.objects.all()
    serializer_class = TriggerSerializer
    permission_classes = [IsAdminUser]


class TriggerDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /triggers/<id>/
    PUT    /triggers/<id>/
    PATCH  /triggers/<id>/
    DELETE /triggers/<id>/
    """

    queryset = Trigger.objects.all()
    serializer_class = TriggerSerializer
    permission_classes = [IsAdminUser]


# ============================================================
# NOTIFICATION TEMPLATE APIs
# ============================================================


class NotificationTemplateListCreateView(
    generics.ListCreateAPIView
):
    """
    GET  /templates/
    POST /templates/
    """

    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return (
            NotificationTemplate.objects
            .select_related("trigger")
            .prefetch_related("variables")
            .order_by("-created_at")
        )


class NotificationTemplateDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    """
    GET    /templates/<id>/
    PUT    /templates/<id>/
    PATCH  /templates/<id>/
    DELETE /templates/<id>/
    """

    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return (
            NotificationTemplate.objects
            .select_related("trigger")
            .prefetch_related("variables")
            .order_by("-created_at")
        )


# ============================================================
# VARIABLE MAPPING APIs
# ============================================================


class VariableMappingListCreateView(
    generics.ListCreateAPIView
):
    """
    GET:
        /templates/<template_id>/variables/

    POST:
        /templates/<template_id>/variables/
    """

    serializer_class = VariableMappingSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        template_id = self.kwargs["template_id"]

        return (
            VariableMapping.objects
            .filter(template_id=template_id)
            .select_related("template")
            .order_by("variable_name")
        )

    def perform_create(self, serializer):
        template_id = self.kwargs["template_id"]

        try:
            template = NotificationTemplate.objects.get(
                pk=template_id
            )
        except NotificationTemplate.DoesNotExist:
            raise NotFound(
                "Notification template not found."
            )

        serializer.save(template=template)


class VariableMappingDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    """
    GET:
        /variables/<id>/

    PUT:
        /variables/<id>/

    PATCH:
        /variables/<id>/

    DELETE:
        /variables/<id>/
    """

    serializer_class = VariableMappingSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return (
            VariableMapping.objects
            .select_related("template")
            .all()
        )


# ============================================================
# WEB PUSH - VAPID PUBLIC KEY
# ============================================================


class VapidPublicKeyView(
    generics.GenericAPIView
):
    """
    GET /vapid-public-key/

    Returns only the public VAPID key.

    The private VAPID key is NEVER exposed.
    """

    permission_classes = [AllowAny]

    def get(self, request):

        public_key = getattr(
            settings,
            "VAPID_PUBLIC_KEY",
            "",
        )

        if not public_key:

            return Response(
                {
                    "detail": (
                        "VAPID public key "
                        "is not configured."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "public_key": public_key,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# WEB PUSH SUBSCRIPTION - REGISTER / UPDATE
# ============================================================


class PushSubscriptionCreateView(
    generics.CreateAPIView
):
    """
    POST /push-subscriptions/register/

    Register a browser push subscription.

    If the endpoint already exists for the same user,
    update/reactivate it.
    """

    serializer_class = PushSubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def create(
        self,
        request,
        *args,
        **kwargs,
    ):

        # ====================================================
        # ENDPOINT
        # ====================================================

        endpoint = request.data.get("endpoint")

        if not endpoint:

            return Response(
                {
                    "endpoint": [
                        "Push subscription endpoint "
                        "is required."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(endpoint, str):

            return Response(
                {
                    "endpoint": [
                        "Endpoint must be a string."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        endpoint = endpoint.strip()

        if not endpoint:

            return Response(
                {
                    "endpoint": [
                        "Push subscription endpoint "
                        "is required."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ====================================================
        # SUBSCRIPTION
        # ====================================================

        subscription_data = request.data.get(
            "subscription"
        )

        if not isinstance(
            subscription_data,
            dict,
        ):

            return Response(
                {
                    "subscription": [
                        "Subscription must be "
                        "a JSON object."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ====================================================
        # SUBSCRIPTION ENDPOINT
        # ====================================================

        subscription_endpoint = (
            subscription_data.get("endpoint")
        )

        if (
            subscription_endpoint
            and subscription_endpoint != endpoint
        ):

            return Response(
                {
                    "subscription": [
                        "Subscription endpoint does "
                        "not match endpoint."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ====================================================
        # KEYS
        # ====================================================

        keys = subscription_data.get("keys")

        if not isinstance(keys, dict):

            return Response(
                {
                    "subscription": [
                        "Subscription keys are required."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not keys.get("p256dh"):

            return Response(
                {
                    "subscription": [
                        "p256dh key is required."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not keys.get("auth"):

            return Response(
                {
                    "subscription": [
                        "auth key is required."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ====================================================
        # CANONICAL SUBSCRIPTION
        # ====================================================

        subscription_data = {
            **subscription_data,
            "endpoint": endpoint,
        }

        # ====================================================
        # FIND EXISTING ENDPOINT
        # ====================================================

        existing = (
            PushSubscription.objects
            .filter(endpoint=endpoint)
            .first()
        )

        # ====================================================
        # EXISTING SUBSCRIPTION
        # ====================================================

        if existing:

            # ------------------------------------------------
            # SECURITY
            # ------------------------------------------------

            if existing.user_id != request.user.id:

                return Response(
                    {
                        "detail": (
                            "This push subscription "
                            "belongs to another user."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # ------------------------------------------------
            # UPDATE / REACTIVATE
            # ------------------------------------------------

            serializer = self.get_serializer(
                existing,
                data={
                    "endpoint": endpoint,
                    "subscription": subscription_data,
                    "is_active": True,
                },
                partial=True,
            )

            serializer.is_valid(
                raise_exception=True
            )

            serializer.save(
                user=request.user,
                is_active=True,
            )

            return Response(
                {
                    "message": (
                        "Push subscription "
                        "updated successfully."
                    ),
                    "subscription": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        # ====================================================
        # CREATE NEW SUBSCRIPTION
        # ====================================================

        serializer = self.get_serializer(
            data={
                "endpoint": endpoint,
                "subscription": subscription_data,
                "is_active": True,
            }
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save(
            user=request.user,
            is_active=True,
        )

        return Response(
            {
                "message": (
                    "Push subscription "
                    "registered successfully."
                ),
                "subscription": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# WEB PUSH SUBSCRIPTION - LIST
# ============================================================


class PushSubscriptionListView(
    generics.ListAPIView
):
    """
    GET /push-subscriptions/

    Returns active push subscriptions
    belonging to the authenticated user.
    """

    serializer_class = PushSubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return (
            PushSubscription.objects
            .filter(
                user=self.request.user,
                is_active=True,
            )
            .order_by("-updated_at")
        )


# ============================================================
# WEB PUSH SUBSCRIPTION - DETAIL
# ============================================================


class PushSubscriptionDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    """
    GET:
        /push-subscriptions/<id>/

    PUT:
        /push-subscriptions/<id>/

    PATCH:
        /push-subscriptions/<id>/

    DELETE:
        /push-subscriptions/<id>/

    DELETE performs a soft delete.
    """

    serializer_class = PushSubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return (
            PushSubscription.objects
            .filter(
                user=self.request.user
            )
        )

    def perform_destroy(self, instance):

        instance.is_active = False

        instance.save(
            update_fields=[
                "is_active",
                "updated_at",
            ]
        )


# ============================================================
# TEST SEND NOTIFICATION API
# ============================================================


class TestSendNotificationView(generics.GenericAPIView):
    """
    POST /test-send/

    Sends a test notification using an existing notification
    template. Supported channels: EMAIL, WHATSAPP, WEB_PUSH.
    """

    permission_classes = [IsAdminUser]

    def post(self, request, *args, **kwargs):
        template_id = request.data.get("templateId")
        channel = request.data.get("channel")
        recipient = request.data.get("recipient")

        if not template_id:
            return Response(
                {"detail": "templateId is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not channel:
            return Response(
                {"detail": "channel is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        channel = str(channel).strip().upper()

        if channel not in {"EMAIL", "WHATSAPP", "WEB_PUSH"}:
            return Response(
                {
                    "detail": (
                        "Invalid channel. Use EMAIL, WHATSAPP "
                        "or WEB_PUSH."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            template = (
                NotificationTemplate.objects
                .select_related("trigger")
                .get(pk=template_id, channel=channel)
            )
        except NotificationTemplate.DoesNotExist:
            return Response(
                {
                    "detail": (
                        "Notification template not found "
                        "for the selected channel."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if not template.is_active:
            return Response(
                {"detail": "This notification template is disabled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not template.trigger.is_active:
            return Response(
                {"detail": "This notification trigger is disabled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        user_name = (
            user.get_full_name()
            or user.username
            or "User"
        )

        title = template.title or "Notification"
        subject = template.subject or title
        body = template.body or ""

        replacements = {
            "{{user_name}}": user_name,
            "{{username}}": user.username,
            "{{email}}": user.email or "",
        }

        for variable, value in replacements.items():
            title = title.replace(variable, str(value))
            subject = subject.replace(variable, str(value))
            body = body.replace(variable, str(value))

        provider = None
        provider_recipient = None
        log_recipient = None

        if channel == "EMAIL":
            provider = EmailProvider()
            provider_recipient = (
                str(recipient).strip() if recipient else ""
            ) or (user.email or "")

            if not provider_recipient:
                return Response(
                    {"detail": "Email recipient is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            log_recipient = provider_recipient

        elif channel == "WHATSAPP":
            provider = WhatsAppProvider()
            provider_recipient = (
                str(recipient).strip() if recipient else ""
            )

            if not provider_recipient:
                profile = getattr(user, "profile", None)
                if profile:
                    provider_recipient = (
                        profile.phone_number or ""
                    ).strip()

            if not provider_recipient:
                provider_recipient = getattr(
                    settings,
                    "TWILIO_WHATSAPP_TO",
                    "",
                )

            if not provider_recipient:
                return Response(
                    {"detail": "WhatsApp recipient is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            log_recipient = provider_recipient

        else:
            provider = WebPushProvider()

            push_subscription = (
                PushSubscription.objects
                .filter(user=user, is_active=True)
                .order_by("-updated_at")
                .first()
            )

            if not push_subscription:
                return Response(
                    {
                        "detail": (
                            "No active Web Push subscription "
                            "was found for this user."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            provider_recipient = push_subscription.subscription
            log_recipient = push_subscription.endpoint

        notification_log = NotificationLog.objects.create(
            trigger=template.trigger,
            template=template,
            channel=channel,
            recipient=log_recipient,
            status=NotificationLog.Status.PENDING,
        )

        try:
            result = provider.send(
                recipient=provider_recipient,
                title=title,
                subject=subject,
                body=body,
            )
        except Exception as exc:
            result = {
                "success": False,
                "provider_message_id": None,
                "error": str(exc),
            }

        if result.get("success"):
            provider_message_id = (
                result.get("provider_message_id") or ""
            )

            notification_log.status = NotificationLog.Status.SENT
            notification_log.provider_message_id = provider_message_id
            notification_log.sent_at = timezone.now()
            notification_log.error_message = ""

            notification_log.save(
                update_fields=[
                    "status",
                    "provider_message_id",
                    "sent_at",
                    "error_message",
                ]
            )

            return Response(
                {
                    "success": True,
                    "message": (
                        f"Test {channel} notification "
                        "sent successfully."
                    ),
                    "channel": channel,
                    "template_id": template.id,
                    "provider_message_id": provider_message_id,
                    "log_id": notification_log.id,
                },
                status=status.HTTP_200_OK,
            )

        error_message = (
            result.get("error")
            or "Notification provider failed."
        )

        notification_log.status = NotificationLog.Status.FAILED
        notification_log.error_message = error_message
        notification_log.save(
            update_fields=[
                "status",
                "error_message",
            ]
        )

        return Response(
            {
                "success": False,
                "message": (
                    f"Test {channel} notification failed."
                ),
                "channel": channel,
                "template_id": template.id,
                "error": error_message,
                "log_id": notification_log.id,
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )


# ============================================================
# LOGOUT NOTIFICATION API
# ============================================================


class LogoutNotificationView(
    generics.GenericAPIView
):
    """
    POST /logout-notification/

    Sends logout notifications through all active
    notification templates.

    Supported channels:
        EMAIL
        WHATSAPP
        WEB_PUSH

    Notification failure does NOT block logout.
    """

    permission_classes = [IsAuthenticated]

    def post(
        self,
        request,
        *args,
        **kwargs,
    ):

        user = request.user

        try:

            # =================================================
            # RUNTIME CONTEXT
            # =================================================

            context = {
                "user_name": user.username,
                "email": user.email,
            }

            # =================================================
            # FIND LOGOUT TEMPLATES
            # =================================================

            notifications = dispatch_notification(
                event_key="logout",
                context=context,
            )

            print(
                "Logout notification templates:",
                len(notifications),
            )

            # =================================================
            # NO ACTIVE TEMPLATES
            # =================================================

            if not notifications:

                return Response(
                    {
                        "message": (
                            "No active logout "
                            "notification templates found."
                        )
                    },
                    status=status.HTTP_200_OK,
                )

            # =================================================
            # WEB PUSH RECIPIENT
            # =================================================

            push_subscription = (
                user.push_subscriptions
                .filter(
                    is_active=True,
                )
                .order_by("-updated_at")
                .first()
            )

            push_recipient = None

            if push_subscription:

                push_recipient = (
                    push_subscription.subscription
                )

            # =================================================
            # WHATSAPP RECIPIENT
            # =================================================

            whatsapp_recipient = None

            try:

                profile = user.profile

                if profile.phone_number:

                    whatsapp_recipient = (
                        profile.phone_number.strip()
                    )

            except Exception:

                whatsapp_recipient = None

            # =================================================
            # RECIPIENTS
            # =================================================

            recipients = {
                "EMAIL": user.email,
                "WHATSAPP": whatsapp_recipient,
                "WEB_PUSH": push_recipient,
            }

            print(
                "Logout notification recipients:",
                {
                    "EMAIL": bool(
                        recipients["EMAIL"]
                    ),
                    "WHATSAPP": bool(
                        recipients["WHATSAPP"]
                    ),
                    "WEB_PUSH": bool(
                        recipients["WEB_PUSH"]
                    ),
                },
            )

            # =================================================
            # SEND
            # =================================================

            logs = send_notifications(
                notifications,
                recipients,
            )

            # =================================================
            # RESULTS
            # =================================================

            for log in logs:

                print(
                    "Logout notification:",
                    log.channel,
                    "|",
                    log.status,
                    "|",
                    log.error_message,
                )

            # =================================================
            # RESPONSE
            # =================================================

            return Response(
                {
                    "message": (
                        "Logout notifications "
                        "processed successfully."
                    ),
                    "logs": [
                        {
                            "id": log.id,
                            "channel": log.channel,
                            "status": log.status,
                        }
                        for log in logs
                    ],
                },
                status=status.HTTP_200_OK,
            )

        except Exception as exc:

            # =================================================
            # IMPORTANT:
            # Notification failure must NOT block logout.
            # =================================================

            print(
                f"Logout notification error: {exc}"
            )

            return Response(
                {
                    "message": (
                        "Logout notification failed."
                    ),
                    "error": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ============================================================
# NOTIFICATION LOG APIs
# ============================================================


class NotificationLogListView(
    generics.ListAPIView
):
    """
    GET /logs/

    Returns notification delivery history.

    Admin users only.
    """

    serializer_class = NotificationLogSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):

        return (
            NotificationLog.objects
            .select_related(
                "trigger",
                "template",
            )
            .all()
            .order_by("-created_at")
        )