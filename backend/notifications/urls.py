from django.urls import path

from .views import (
    TriggerListCreateView,
    TriggerDetailView,
    NotificationTemplateListCreateView,
    NotificationTemplateDetailView,
    VariableMappingListCreateView,
    VariableMappingDetailView,
    VapidPublicKeyView,
    PushSubscriptionCreateView,
    PushSubscriptionListView,
    PushSubscriptionDetailView,
    LogoutNotificationView,
    NotificationLogListView,
    TestSendNotificationView,
)


urlpatterns = [

    # ============================================================
    # TRIGGERS
    # ============================================================

    path(
        "triggers/",
        TriggerListCreateView.as_view(),
        name="trigger-list-create",
    ),

    path(
        "triggers/<int:pk>/",
        TriggerDetailView.as_view(),
        name="trigger-detail",
    ),


    # ============================================================
    # NOTIFICATION TEMPLATES
    # ============================================================

    path(
        "templates/",
        NotificationTemplateListCreateView.as_view(),
        name="template-list-create",
    ),

    path(
        "templates/<int:pk>/",
        NotificationTemplateDetailView.as_view(),
        name="template-detail",
    ),


    # ============================================================
    # VARIABLES
    # ============================================================

    path(
        "templates/<int:template_id>/variables/",
        VariableMappingListCreateView.as_view(),
        name="variable-list-create",
    ),

    path(
        "variables/<int:pk>/",
        VariableMappingDetailView.as_view(),
        name="variable-detail",
    ),


    # ============================================================
    # WEB PUSH
    # ============================================================

    path(
        "vapid-public-key/",
        VapidPublicKeyView.as_view(),
        name="vapid-public-key",
    ),

    path(
        "push-subscriptions/",
        PushSubscriptionListView.as_view(),
        name="push-subscription-list",
    ),

    path(
        "push-subscriptions/register/",
        PushSubscriptionCreateView.as_view(),
        name="push-subscription-create",
    ),

    path(
        "push-subscriptions/<int:pk>/",
        PushSubscriptionDetailView.as_view(),
        name="push-subscription-detail",
    ),


    # ============================================================
    # LOGOUT NOTIFICATION
    # ============================================================

    path(
        "logout-notification/",
        LogoutNotificationView.as_view(),
        name="logout-notification",
    ),


    # ============================================================
    # NOTIFICATION LOGS
    # ============================================================

    path(
        "logs/",
        NotificationLogListView.as_view(),
        name="notification-log-list",
    ),


    # ============================================================
    # TEST SEND
    # ============================================================

    path(
        "test-send/",
        TestSendNotificationView.as_view(),
        name="test-send-notification",
    ),
]