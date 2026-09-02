from django.contrib.auth import authenticate

from rest_framework import serializers

from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
)

from notifications.notification_dispatcher import (
    dispatch_notification,
)

from notifications.notification_sender import (
    send_notifications,
)


# ============================================================
# LOGIN SERIALIZER
# ============================================================

class LoginSerializer(serializers.Serializer):

    username = serializers.CharField()

    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def validate(self, attrs):

        username = attrs.get("username")
        password = attrs.get("password")

        user = authenticate(
            username=username,
            password=password,
        )

        if user is None:
            raise serializers.ValidationError(
                "Invalid username or password."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "This account is inactive."
            )

        if not user.is_staff:
            raise serializers.ValidationError(
                "Only admin users can access this system."
            )

        attrs["user"] = user

        return attrs


# ============================================================
# USER SERIALIZER
# ============================================================

class UserSerializer(serializers.Serializer):

    id = serializers.IntegerField(
        read_only=True
    )

    username = serializers.CharField(
        read_only=True
    )

    email = serializers.EmailField(
        read_only=True
    )

    is_staff = serializers.BooleanField(
        read_only=True
    )


# ============================================================
# JWT LOGIN SERIALIZER
# ============================================================

class CustomTokenObtainPairSerializer(
    TokenObtainPairSerializer
):
    """
    JWT login serializer with automatic
    Email, WhatsApp and Web Push notifications.
    """

    def validate(self, attrs):

        # ====================================================
        # NORMAL JWT LOGIN
        # ====================================================

        data = super().validate(attrs)

        user = self.user

        print(
            "========== LOGIN SERIALIZER CALLED =========="
        )

        print(
            "User:",
            user.username,
        )

        # ====================================================
        # LOGIN NOTIFICATIONS
        # ====================================================

        try:

            # ------------------------------------------------
            # Runtime template variables
            # ------------------------------------------------

            context = {
                "user_name": user.username,
                "email": user.email,
            }

            # ------------------------------------------------
            # Get active login templates
            # ------------------------------------------------

            notifications = dispatch_notification(
                event_key="login",
                context=context,
            )

            print(
                "Login notification templates:",
                len(notifications),
            )

            # ------------------------------------------------
            # Get active Web Push subscription
            # ------------------------------------------------

            push_subscription = (
                user.push_subscriptions
                .filter(
                    is_active=True
                )
                .order_by(
                    "-updated_at"
                )
                .first()
            )

            # ------------------------------------------------
            # Web Push recipient
            # ------------------------------------------------

            push_recipient = None

            if push_subscription:
                push_recipient = (
                    push_subscription.subscription
                )

            # ------------------------------------------------
            # WhatsApp recipient
            # ------------------------------------------------

            whatsapp_recipient = None

            if hasattr(user, "profile"):
                whatsapp_recipient = (
                    user.profile.phone_number
                )

            # ------------------------------------------------
            # Notification recipients
            # ------------------------------------------------

            recipients = {
                "EMAIL": user.email,

                "WHATSAPP": whatsapp_recipient,

                "WEB_PUSH": push_recipient,
            }

            print(
                "Login notification recipients:",
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

            # ------------------------------------------------
            # Send notifications
            # ------------------------------------------------

            logs = send_notifications(
                notifications,
                recipients,
            )

            # ------------------------------------------------
            # Print results
            # ------------------------------------------------

            for log in logs:

                print(
                    "Login notification:",
                    log.channel,
                    "|",
                    log.status,
                    "|",
                    log.error_message,
                )

        except Exception as exc:

            # ------------------------------------------------
            # Notification failure must NOT break login
            # ------------------------------------------------

            print(
                "Login notification error:",
                exc,
            )

        # ====================================================
        # RETURN JWT RESPONSE
        # ====================================================

        return data