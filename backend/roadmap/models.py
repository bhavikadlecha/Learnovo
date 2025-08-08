from django.db import models
from django.conf import settings

class Topic(models.Model):
    name = models.CharField(max_length=200)
    subject = models.CharField(max_length=200)
    estimated_time = models.FloatField(null=True, blank=True)

class UserProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    time_spent = models.FloatField(default=0)
    target_time = models.FloatField(default=0)
    completed = models.BooleanField(default=False)
    date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.topic.name}"

class StudyPlan(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
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


class UserRoadmap(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    subject = models.CharField(max_length=200, default='General')
    proficiency = models.CharField(max_length=50, choices=[
        ('Beginner', 'Beginner'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced')
    ], default='Beginner')
    weekly_hours = models.IntegerField(default=10)
    deadline = models.DateField(null=True, blank=True)
    roadmap_data = models.JSONField()  # Store the generated roadmap JSON
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_completed = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.username if self.user else 'Anonymous'}"
