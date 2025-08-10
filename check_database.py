import os
import django
import sys

# Add the backend directory to the Python path
sys.path.append('D:\\code\\Learnovo\\backend')

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learning_roadmap_django.settings')

# Setup Django
django.setup()

from roadmap.models import StudyPlan
from roadmap.views import get_default_user

def check_study_plans():
    print("Checking study plans in database...")
    
    # Get the default user
    user = get_default_user()
    print(f"Default user: {user.username} (ID: {user.id})")
    
    # Check all study plans
    all_plans = StudyPlan.objects.all()
    print(f"Total study plans in database: {all_plans.count()}")
    
    for plan in all_plans:
        print(f"  Plan ID: {plan.id}, Topic: {plan.main_topic}, User: {plan.user.username}")
    
    # Check study plans for default user
    user_plans = StudyPlan.objects.filter(user=user)
    print(f"Study plans for default user: {user_plans.count()}")
    
    for plan in user_plans:
        print(f"  Plan ID: {plan.id}, Topic: {plan.main_topic}, Time: {plan.available_time}")
        print(f"  Roadmaps count: {len(plan.roadmaps) if plan.roadmaps else 0}")

if __name__ == "__main__":
    check_study_plans()
