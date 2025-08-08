# serializers.py
from rest_framework import serializers
from .models import StudyPlan, RoadmapTopic, UserRoadmap

class RoadmapSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapTopic
        fields = ['id', 'title', 'description', 'is_completed', 'created_at']

class StudyPlanSerializer(serializers.ModelSerializer):
    roadmaps = RoadmapSerializer(many=True, read_only=True)

    class Meta:
        model = StudyPlan
        fields = '__all__'

class UserRoadmapSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRoadmap
        fields = ['id', 'title', 'description', 'subject', 'proficiency', 'weekly_hours', 
                 'deadline', 'roadmap_data', 'created_at', 'updated_at', 'is_completed']
        read_only_fields = ['created_at', 'updated_at']

