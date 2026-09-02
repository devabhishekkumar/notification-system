from django.urls import path

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .serializers import (
    CustomTokenObtainPairSerializer,
)

from .views import (
    LogoutView,
    MeView,
)


# ============================================================
# CUSTOM JWT LOGIN VIEW
# ============================================================

class CustomTokenObtainPairView(
    TokenObtainPairView
):
    serializer_class = (
        CustomTokenObtainPairSerializer
    )


# ============================================================
# URLS
# ============================================================

urlpatterns = [

    # --------------------------------------------------------
    # LOGIN
    # --------------------------------------------------------

    path(
        "login/",
        CustomTokenObtainPairView.as_view(),
        name="login",
    ),

    # --------------------------------------------------------
    # REFRESH TOKEN
    # --------------------------------------------------------

    path(
        "refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh",
    ),

    # --------------------------------------------------------
    # LOGOUT
    # --------------------------------------------------------

    path(
        "logout/",
        LogoutView.as_view(),
        name="logout",
    ),

    # --------------------------------------------------------
    # CURRENT USER
    # --------------------------------------------------------

    path(
        "me/",
        MeView.as_view(),
        name="me",
    ),
]