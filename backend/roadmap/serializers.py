# serializers.py
from rest_framework import serializers
from .models import StudyPlan, RoadmapTopic, UserRoadmap

class RoadmapSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapTopic
        fields = ['id', 'title', 'description', 'is_completed', 'created_at', 'prerequisites']

class StudyPlanSerializer(serializers.ModelSerializer):
    roadmaps = RoadmapSerializer(many=True, read_only=True)
    purpose_of_study = serializers.ChoiceField(
        choices=StudyPlan.PURPOSE_CHOICES, 
        required=False, 
        default='personal_interest'
    )

    class Meta:
        model = StudyPlan
        fields = ['id', 'main_topic', 'available_time', 'created_at', 'roadmaps', 'user', 'purpose_of_study']
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {'user': {'required': False}}

class UserRoadmapSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRoadmap
        fields = ['id', 'title', 'description', 'subject', 'proficiency', 'weekly_hours', 
                 'deadline', 'roadmap_data', 'created_at', 'updated_at', 'is_completed']
        read_only_fields = ['created_at', 'updated_at']

