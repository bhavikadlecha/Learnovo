from django.urls import path
from . import views

app_name = 'learning'

urlpatterns = [
    # Subject and Topic endpoints
    path('subjects/', views.SubjectListView.as_view(), name='subjects'),
    path('topics/', views.TopicListView.as_view(), name='topics'),
    path('topics/<int:pk>/', views.TopicDetailView.as_view(), name='topic_detail'),
    
    # Learning Preferences endpoints
    path('preferences/', views.LearningPreferenceView.as_view(), name='preferences'),
    path('preferences/create/', views.create_learning_preference, name='create_preferences'),
    
    # Learning Goals endpoints
    path('goals/', views.LearningGoalListView.as_view(), name='goals'),
    path('goals/<int:pk>/', views.LearningGoalDetailView.as_view(), name='goal_detail'),
    
    # Learning Sessions endpoints
    path('sessions/', views.LearningSessionListView.as_view(), name='sessions'),
    path('sessions/<int:pk>/', views.LearningSessionDetailView.as_view(), name='session_detail'),
    path('sessions/<int:session_id>/end/', views.end_learning_session, name='end_session'),
    
    # Resources endpoints
    path('resources/', views.ResourceListView.as_view(), name='resources'),
    path('resources/<int:pk>/', views.ResourceDetailView.as_view(), name='resource_detail'),
    
    # User Resources endpoints
    path('user-resources/', views.UserResourceListView.as_view(), name='user_resources'),
    path('user-resources/<int:pk>/', views.UserResourceDetailView.as_view(), name='user_resource_detail'),
    path('user-resources/<int:user_resource_id>/progress/', views.update_resource_progress, name='update_resource_progress'),
    
    # Progress endpoints
    path('progress/', views.ProgressListView.as_view(), name='progress'),
    path('progress/<int:pk>/', views.ProgressDetailView.as_view(), name='progress_detail'),
    
    # Dashboard endpoint
    path('dashboard/', views.dashboard_data, name='dashboard'),
] 