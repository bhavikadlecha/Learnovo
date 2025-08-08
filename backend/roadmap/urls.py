# roadmap/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('generate_roadmap/', views.generate_roadmap, name='generate_roadmap'),
    path('user_study_plans/', views.user_study_plans, name='user_study_plans'),
    path('studyplan/create/', views.create_study_plan, name='create_study_plan'),
    path('delete_plan/<int:pk>/', views.delete_study_plan, name='delete_study_plan'),
    path('roadmap/get_plan/<int:pk>/', views.get_studyplan_detail, name='get_studyplan_detail'),

]
