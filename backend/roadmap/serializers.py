# serializers.py
from rest_framework import serializers
from .models import StudyPlan, RoadmapTopic

class RoadmapSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapTopic
        fields = ['id', 'title', 'description', 'is_completed', 'created_at']

class StudyPlanSerializer(serializers.ModelSerializer):
    roadmaps = RoadmapSerializer(many=True, read_only=True)

    class Meta:
        model = StudyPlan
        fields = '__all__'

