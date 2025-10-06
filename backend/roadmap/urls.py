# roadmap/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('generate_roadmap/', views.generate_roadmap, name='generate_roadmap'),
    path('user_study_plans/', views.user_study_plans, name='user_study_plans'),
    path('studyplan/create/', views.create_study_plan, name='create_study_plan'),
    path('delete_plan/<int:pk>/', views.delete_study_plan, name='delete_study_plan'),
    path('roadmap/get_plan/<int:pk>/', views.get_studyplan_detail, name='get_studyplan_detail'),
    path('roadmap_cards/', views.get_roadmap_cards, name='get_roadmap_cards'),
    path('create_from_form/', views.create_roadmap_from_form, name='create_roadmap_from_form'),
    path('user_roadmaps/', views.get_user_roadmaps, name='get_user_roadmaps'),
    path('user_roadmaps/<int:roadmap_id>/', views.delete_user_roadmap, name='delete_user_roadmap'),
    path('roadmap_detail/<int:roadmap_id>/', views.get_roadmap_detail, name='get_roadmap_detail'),
    path('purpose-choices/', views.get_purpose_choices, name='get_purpose_choices'),
    path('test-groq/', views.test_groq_api, name='test_groq_api'),
]
