from django.shortcuts import render
from rest_framework import status, generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import (
    Subject, Topic, LearningPreference, LearningGoal, 
    LearningSession, Resource, UserResource, Progress
)
from .serializers import (
    SubjectSerializer, TopicSerializer, LearningPreferenceSerializer,
    LearningGoalSerializer, LearningSessionSerializer, ResourceSerializer,
    UserResourceSerializer, ProgressSerializer, TopicDetailSerializer,
    LearningGoalDetailSerializer, ResourceDetailSerializer, UserResourceDetailSerializer
)
from django.utils import timezone

# Create your views here.

# Subject and Topic Views
class SubjectListView(generics.ListAPIView):
    """List all subjects"""
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.AllowAny]


class TopicListView(generics.ListAPIView):
    """List topics by subject"""
    serializer_class = TopicSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        subject_id = self.request.query_params.get('subject_id')
        if subject_id:
            return Topic.objects.filter(subject_id=subject_id)
        return Topic.objects.all()


class TopicDetailView(generics.RetrieveAPIView):
    """Get detailed topic information"""
    queryset = Topic.objects.all()
    serializer_class = TopicDetailSerializer
    permission_classes = [permissions.AllowAny]


# Learning Preferences Views
class LearningPreferenceView(generics.RetrieveUpdateAPIView):
    """Get or update user's learning preferences"""
    serializer_class = LearningPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return get_object_or_404(LearningPreference, user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_learning_preference(request):
    """Create learning preferences for user"""
    serializer = LearningPreferenceSerializer(data=request.data)
    if serializer.is_valid():
        # Check if user already has preferences
        if LearningPreference.objects.filter(user=request.user).exists():
            return Response(
                {'error': 'Learning preferences already exist for this user'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Learning Goals Views
class LearningGoalListView(generics.ListCreateAPIView):
    """List and create learning goals"""
    serializer_class = LearningGoalSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']
    
    def get_queryset(self):
        return LearningGoal.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class LearningGoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a learning goal"""
    serializer_class = LearningGoalDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return LearningGoal.objects.filter(user=self.request.user)


# Learning Sessions Views
class LearningSessionListView(generics.ListCreateAPIView):
    """List and create learning sessions"""
    serializer_class = LearningSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return LearningSession.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class LearningSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a learning session"""
    serializer_class = LearningSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return LearningSession.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def end_learning_session(request, session_id):
    """End a learning session"""
    session = get_object_or_404(LearningSession, id=session_id, user=request.user)
    session.end_time = timezone.now()
    session.duration_minutes = (session.end_time - session.start_time).total_seconds() / 60
    session.save()
    return Response(LearningSessionSerializer(session).data)


# Resources Views
class ResourceListView(generics.ListAPIView):
    """List learning resources with filtering"""
    serializer_class = ResourceSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']
    
    def get_queryset(self):
        queryset = Resource.objects.all()
        subject_id = self.request.query_params.get('subject_id')
        topic_id = self.request.query_params.get('topic_id')
        difficulty = self.request.query_params.get('difficulty')
        resource_type = self.request.query_params.get('resource_type')
        is_free = self.request.query_params.get('is_free')
        
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        if topic_id:
            queryset = queryset.filter(topic_id=topic_id)
        if difficulty:
            queryset = queryset.filter(difficulty_level=difficulty)
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        if is_free is not None:
            queryset = queryset.filter(is_free=is_free.lower() == 'true')
        
        return queryset


class ResourceDetailView(generics.RetrieveAPIView):
    """Get detailed resource information"""
    queryset = Resource.objects.all()
    serializer_class = ResourceDetailSerializer
    permission_classes = [permissions.AllowAny]


# User Resources Views
class UserResourceListView(generics.ListCreateAPIView):
    """List and create user resources"""
    serializer_class = UserResourceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserResource.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class UserResourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a user resource"""
    serializer_class = UserResourceDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserResource.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_resource_progress(request, user_resource_id):
    """Update progress for a user resource"""
    user_resource = get_object_or_404(UserResource, id=user_resource_id, user=request.user)
    progress = request.data.get('progress_percentage', 0)
    
    if progress >= 100:
        user_resource.status = 'completed'
        user_resource.completed_at = timezone.now()
    
    user_resource.progress_percentage = progress
    user_resource.save()
    
    return Response(UserResourceDetailSerializer(user_resource).data)


# Progress Views
class ProgressListView(generics.ListAPIView):
    """List user's progress records"""
    serializer_class = ProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Progress.objects.filter(user=self.request.user)


class ProgressDetailView(generics.RetrieveAPIView):
    """Get detailed progress information"""
    serializer_class = ProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Progress.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_data(request):
    """Get dashboard data for the user"""
    user = request.user
    
    # Get user's learning preferences
    try:
        preferences = LearningPreference.objects.get(user=user)
        preferences_data = LearningPreferenceSerializer(preferences).data
    except LearningPreference.DoesNotExist:
        preferences_data = None
    
    # Get user's goals
    goals = LearningGoal.objects.filter(user=user)
    goals_data = LearningGoalSerializer(goals, many=True).data
    
    # Get recent sessions
    recent_sessions = LearningSession.objects.filter(user=user).order_by('-start_time')[:5]
    sessions_data = LearningSessionSerializer(recent_sessions, many=True).data
    
    # Get progress summary
    progress_records = Progress.objects.filter(user=user)
    progress_data = ProgressSerializer(progress_records, many=True).data
    
    # Get recommended resources
    if preferences_data:
        recommended_resources = Resource.objects.filter(
            subject=preferences_data['subject'],
            topic=preferences_data['topic'],
            difficulty_level=preferences_data['proficiency_level']
        )[:5]
        resources_data = ResourceSerializer(recommended_resources, many=True).data
    else:
        resources_data = []
    
    return Response({
        'preferences': preferences_data,
        'goals': goals_data,
        'recent_sessions': sessions_data,
        'progress': progress_data,
        'recommended_resources': resources_data,
    })
