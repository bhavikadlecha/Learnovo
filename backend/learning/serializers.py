from rest_framework import serializers
from .models import (
    Subject, Topic, LearningPreference, LearningGoal, 
    LearningSession, Resource, UserResource, Progress
)


class SubjectSerializer(serializers.ModelSerializer):
    """Serializer for Subject model"""
    class Meta:
        model = Subject
        fields = '__all__'


class TopicSerializer(serializers.ModelSerializer):
    """Serializer for Topic model"""
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    
    class Meta:
        model = Topic
        fields = '__all__'


class LearningPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for LearningPreference model"""
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = LearningPreference
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')


class LearningGoalSerializer(serializers.ModelSerializer):
    """Serializer for LearningGoal model"""
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = LearningGoal
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')


class LearningSessionSerializer(serializers.ModelSerializer):
    """Serializer for LearningSession model"""
    goal_title = serializers.CharField(source='goal.title', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = LearningSession
        fields = '__all__'
        read_only_fields = ('user', 'created_at')


class ResourceSerializer(serializers.ModelSerializer):
    """Serializer for Resource model"""
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    
    class Meta:
        model = Resource
        fields = '__all__'
        read_only_fields = ('created_at',)


class UserResourceSerializer(serializers.ModelSerializer):
    """Serializer for UserResource model"""
    resource_title = serializers.CharField(source='resource.title', read_only=True)
    resource_type = serializers.CharField(source='resource.resource_type', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = UserResource
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')


class ProgressSerializer(serializers.ModelSerializer):
    """Serializer for Progress model"""
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Progress
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'last_activity')


# Nested serializers for detailed views
class TopicDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for Topic with subject info"""
    subject = SubjectSerializer(read_only=True)
    
    class Meta:
        model = Topic
        fields = '__all__'


class LearningGoalDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for LearningGoal with related info"""
    subject = SubjectSerializer(read_only=True)
    topic = TopicSerializer(read_only=True)
    sessions = LearningSessionSerializer(many=True, read_only=True)
    
    class Meta:
        model = LearningGoal
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')


class ResourceDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for Resource with related info"""
    subject = SubjectSerializer(read_only=True)
    topic = TopicSerializer(read_only=True)
    
    class Meta:
        model = Resource
        fields = '__all__'
        read_only_fields = ('created_at',)


class UserResourceDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for UserResource with resource info"""
    resource = ResourceDetailSerializer(read_only=True)
    
    class Meta:
        model = UserResource
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at') 