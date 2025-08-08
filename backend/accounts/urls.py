# backend/accounts/urls.py
from django.urls import path
from .views import UsernameOrEmailTokenObtainPairView, signup, profile  # ✅ Must NOT be broken
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('signup/', signup, name='signup'),
    path('profile/', profile, name='profile'),
    path("token/", UsernameOrEmailTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh')
]
