from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

def root_view(request):
    return JsonResponse({"message": "Backend is running."})

urlpatterns = [
    path('', root_view),  # root path
    path('admin/', admin.site.urls),
    path('roadmap/', include('roadmap.urls')),
    path('api/', include('accounts.urls')), 
    # Note: Token endpoints are now handled in accounts.urls
]
