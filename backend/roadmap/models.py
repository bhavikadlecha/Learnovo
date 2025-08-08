from django.db import models
from django.contrib.auth.models import User

class Topic(models.Model):
    name = models.CharField(max_length=200)
    subject = models.CharField(max_length=200)
    estimated_time = models.FloatField(null=True, blank=True)

class UserProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    time_spent = models.FloatField(default=0)
    target_time = models.FloatField(default=0)
    completed = models.BooleanField(default=False)
    date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.topic.name}"

class StudyPlan(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    main_topic = models.CharField(max_length=255)
    available_time = models.IntegerField()
    created_at = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.main_topic

class RoadmapTopic(models.Model):
    study_plan = models.ForeignKey(StudyPlan, on_delete=models.CASCADE, related_name='roadmaps')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({'Completed' if self.is_completed else 'In Progress'})"
