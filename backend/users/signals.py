from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from django.contrib.auth import get_user_model

from roadmap.models import StudyPlan, UserRoadmap

User = get_user_model()


@receiver(post_save, sender=User)
def create_user_defaults(sender, instance, created, **kwargs):
    """When a new user signs up, create empty per-user StudyPlan and UserRoadmap entries

    This ensures each user has isolated storage and dashboards start empty (zeroed).
    If entries already exist, the handler is idempotent and will not duplicate.
    """
    if not created:
        return

    try:
        # Create an empty study plan as a placeholder (if none exist)
        if not StudyPlan.objects.filter(user=instance).exists():
            StudyPlan.objects.create(
                user=instance,
                main_topic='Getting Started',
                available_time=0,
                purpose_of_study='skill_gaining'
            )

        # Create a placeholder empty UserRoadmap
        if not UserRoadmap.objects.filter(user=instance).exists():
            UserRoadmap.objects.create(
                user=instance,
                title='My Roadmap',
                description='Automatically created empty roadmap',
                subject='General',
                proficiency='Beginner',
                weekly_hours=0,
                roadmap_data={'roadmap': []}
            )
    except Exception as e:
        # Print exception so failures during signal handling are visible during tests
        import traceback
        print(f"Error in create_user_defaults for user={instance}: {e}")
        traceback.print_exc()
