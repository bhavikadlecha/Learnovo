import os
import sys
import django

# Ensure backend package path is on sys.path so Django settings module can be found
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learning_roadmap_django.settings')
django.setup()

from django.contrib.auth import get_user_model
from roadmap.models import StudyPlan, UserRoadmap
from rest_framework.test import APIRequestFactory, force_authenticate
from roadmap.views import create_study_plan

User = get_user_model()

email = 'testsync@example.com'
username = 'testsync'
password = 'pass123'

# Remove existing test user to force re-creation and trigger signals
User.objects.filter(email=email).delete()
user = User.objects.create_user(email=email, username=username, password=password)
print('Created user (fresh):', user.email)

# Check defaults created by signals
sp_count = StudyPlan.objects.filter(user=user).count()
ur_count = UserRoadmap.objects.filter(user=user).count()
print(f'StudyPlan count for user: {sp_count}')
print(f'UserRoadmap count for user: {ur_count}')

# Now simulate creating a study plan via the view (authenticated)
factory = APIRequestFactory()
data = {'main_topic': 'Django', 'available_time': 40, 'purpose_of_study': 'competitive_exam'}
request = factory.post('/api/roadmap/create_study_plan/', data, format='json')
# Force authentication so view sees an authenticated user
force_authenticate(request, user=user)

response = create_study_plan(request)
print('create_study_plan response status:', getattr(response, 'status_code', None))
try:
    print('create_study_plan response data:', response.data)
except Exception:
    print('Response content:', getattr(response, 'content', None))

# Recount
sp_count2 = StudyPlan.objects.filter(user=user).count()
ur_count2 = UserRoadmap.objects.filter(user=user).count()
print(f'After API call - StudyPlan count: {sp_count2}, UserRoadmap count: {ur_count2}')
