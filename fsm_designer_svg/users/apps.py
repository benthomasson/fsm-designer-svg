from django.apps import AppConfig


class UsersAppConfig(AppConfig):

    name = "fsm_designer_svg.users"
    verbose_name = "Users"

    def ready(self):
        try:
            import users.signals  # noqa F401
        except ImportError:
            pass
