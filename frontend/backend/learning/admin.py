from django.contrib import admin
from .models import (
    Subject, Topic, LearningPreference, LearningGoal, 
    LearningSession, Resource, UserResource, Progress
)


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject', 'description')
    list_filter = ('subject',)
    search_fields = ('name', 'subject__name')


@admin.register(LearningPreference)
class LearningPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'subject', 'topic', 'proficiency_level', 'weekly_hours', 'deadline')
    list_filter = ('subject', 'proficiency_level', 'created_at')
    search_fields = ('user__email', 'user__username', 'subject__name')


@admin.register(LearningGoal)
class LearningGoalAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'subject', 'topic', 'status', 'progress_percentage', 'target_date')
    list_filter = ('status', 'subject', 'created_at')
    search_fields = ('user__email', 'title', 'subject__name')
    date_hierarchy = 'target_date'


@admin.register(LearningSession)
class LearningSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'goal', 'start_time', 'end_time', 'duration_minutes')
    list_filter = ('start_time', 'goal__subject')
    search_fields = ('user__email', 'goal__title')
    date_hierarchy = 'start_time'


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'resource_type', 'subject', 'topic', 'difficulty_level', 'is_free')
    list_filter = ('resource_type', 'subject', 'difficulty_level', 'is_free', 'created_at')
    search_fields = ('title', 'description', 'subject__name')
    readonly_fields = ('created_at',)


@admin.register(UserResource)
class UserResourceAdmin(admin.ModelAdmin):
    list_display = ('user', 'resource', 'status', 'progress_percentage', 'completed_at')
    list_filter = ('status', 'resource__subject', 'created_at')
    search_fields = ('user__email', 'resource__title')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'subject', 'topic', 'overall_progress', 'time_spent_minutes', 'last_activity')
    list_filter = ('subject', 'created_at')
    search_fields = ('user__email', 'subject__name')
    readonly_fields = ('created_at', 'last_activity')
