from django.contrib import admin
from .models import Topic, UserProgress

@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject', 'estimated_time')

@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'topic', 'time_spent', 'target_time', 'completed', 'date')
