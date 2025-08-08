from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.hashers import check_password

User = get_user_model()

class EmailBackend(BaseAuthentication):
    def authenticate(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if email is None or password is None:
            return None

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise AuthenticationFailed("No user with this email")

        if not check_password(password, user.password):
            raise AuthenticationFailed("Invalid password")

        return (user, None)
