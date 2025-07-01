from django.db import models
from django.conf import settings


class Subject(models.Model):
    """Subject model for organizing learning content"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)  # For emoji or icon class
    
    def __str__(self):
        return self.name


class Topic(models.Model):
    """Topic model within subjects"""
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='topics')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['subject', 'name']
    
    def __str__(self):
        return f"{self.subject.name} - {self.name}"


class LearningPreference(models.Model):
    """User's learning preferences and goals"""
    PROFICIENCY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='learning_preferences')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    proficiency_level = models.CharField(max_length=20, choices=PROFICIENCY_CHOICES)
    weekly_hours = models.PositiveIntegerField(help_text="Hours per week dedicated to learning")
    deadline = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.subject.name} ({self.topic.name})"


class LearningGoal(models.Model):
    """Specific learning goals for users"""
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('paused', 'Paused'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='learning_goals')
    title = models.CharField(max_length=200)
    description = models.TextField()
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    target_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    progress_percentage = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.title}"


class LearningSession(models.Model):
    """Track individual learning sessions"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='learning_sessions')
    goal = models.ForeignKey(LearningGoal, on_delete=models.CASCADE, related_name='sessions')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.goal.title} ({self.start_time.date()})"


class Resource(models.Model):
    """Learning resources (videos, articles, etc.)"""
    RESOURCE_TYPE_CHOICES = [
        ('video', 'Video'),
        ('article', 'Article'),
        ('book', 'Book'),
        ('course', 'Course'),
        ('exercise', 'Exercise'),
        ('quiz', 'Quiz'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPE_CHOICES)
    url = models.URLField(blank=True)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='resources')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='resources')
    difficulty_level = models.CharField(max_length=20, choices=LearningPreference.PROFICIENCY_CHOICES)
    estimated_duration = models.PositiveIntegerField(help_text="Estimated duration in minutes", null=True, blank=True)
    is_free = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.title} ({self.subject.name})"


class UserResource(models.Model):
    """Track user's interaction with resources"""
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('bookmarked', 'Bookmarked'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_resources')
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='user_resources')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    progress_percentage = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'resource']
    
    def __str__(self):
        return f"{self.user.email} - {self.resource.title}"


class Progress(models.Model):
    """Overall learning progress tracking"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='progress_records')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    overall_progress = models.PositiveIntegerField(default=0, help_text="Overall progress percentage")
    time_spent_minutes = models.PositiveIntegerField(default=0)
    resources_completed = models.PositiveIntegerField(default=0)
    goals_completed = models.PositiveIntegerField(default=0)
    last_activity = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'subject', 'topic']
    
    def __str__(self):
        return f"{self.user.email} - {self.subject.name} ({self.overall_progress}%)"
