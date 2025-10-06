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
    PURPOSE_CHOICES = [
        ('academics', 'Academics'),
        ('competitive_exam', 'Competitive Exam'),
        ('skill_development', 'Skill Development'),
        ('career_change', 'Career Change'),
        ('personal_interest', 'Personal Interest'),
        ('professional_certification', 'Professional Certification'),
        ('interview_preparation', 'Interview Preparation'),
        ('teaching_preparation', 'Teaching Preparation'),
        ('research', 'Research'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    main_topic = models.CharField(max_length=255)
    available_time = models.IntegerField()
    purpose_of_study = models.CharField(
        max_length=50, 
        choices=PURPOSE_CHOICES, 
        default='personal_interest',
        help_text="Select the primary purpose for your study plan"
    )
    created_at = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.main_topic} ({self.get_purpose_of_study_display()})"

class RoadmapTopic(models.Model):
    study_plan = models.ForeignKey(StudyPlan, on_delete=models.CASCADE, related_name='roadmaps')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    prerequisites = models.ManyToManyField('self', symmetrical=False, blank=True)

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
