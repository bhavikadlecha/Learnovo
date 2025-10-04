from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'
    def ready(self):
        # Import signals to ensure they're registered when the app is ready
        try:
            import users.signals  # noqa: F401
        except Exception:
            pass
