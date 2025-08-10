#!/usr/bin/env python3

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learning_roadmap_django.settings')
django.setup()

from roadmap.models import StudyPlan, RoadmapTopic, UserRoadmap

print("🗃️ Database Storage Analysis:")
print("=" * 50)

# Check StudyPlan records
study_plans = StudyPlan.objects.all().order_by('-id')[:3]
print(f"📊 Recent StudyPlan records: {len(study_plans)}")

for plan in study_plans:
    print(f"\n🔍 StudyPlan ID: {plan.id}")
    print(f"   📝 Topic: {plan.main_topic}")
    print(f"   ⏰ Time: {plan.available_time}")
    print(f"   📅 Created: {plan.created_at}")
    
    # Check associated RoadmapTopics (flattened)
    roadmap_topics = plan.roadmaps.all()
    print(f"   📋 RoadmapTopics: {len(roadmap_topics)} (flattened)")
    for i, topic in enumerate(roadmap_topics[:5]):  # Show first 5
        print(f"      {i+1}. {topic.title}")
    if len(roadmap_topics) > 5:
        print(f"      ... and {len(roadmap_topics) - 5} more")

print("\n" + "=" * 50)

# Check UserRoadmap records (nested JSON)
user_roadmaps = UserRoadmap.objects.all().order_by('-id')[:3]
print(f"📊 Recent UserRoadmap records: {len(user_roadmaps)}")

for roadmap in user_roadmaps:
    print(f"\n🔍 UserRoadmap ID: {roadmap.id}")
    print(f"   📝 Title: {roadmap.title}")
    print(f"   📅 Created: {roadmap.created_at}")
    
    # Check nested roadmap_data
    if roadmap.roadmap_data:
        roadmap_items = roadmap.roadmap_data.get('roadmap', [])
        print(f"   🗺️ Nested roadmap items: {len(roadmap_items)}")
        
        total_subtopics = 0
        for item in roadmap_items[:3]:  # Show first 3
            subtopics_count = len(item.get('subtopics', [])) if isinstance(item, dict) else 0
            total_subtopics += subtopics_count
            topic_name = item.get('topic', 'Unknown') if isinstance(item, dict) else 'Unknown'
            print(f"      • {topic_name}: {subtopics_count} subtopics")
        
        print(f"   📊 Total subtopics in first 3: {total_subtopics}")
        
        if len(roadmap_items) > 3:
            print(f"      ... and {len(roadmap_items) - 3} more main topics")
    else:
        print(f"   ❌ No roadmap_data found")

print("\n" + "=" * 50)
print("🎯 Summary:")
print("   • RoadmapTopic = Flattened storage (loses hierarchy)")
print("   • UserRoadmap = Nested JSON storage (preserves hierarchy)")
print("   • Frontend should use UserRoadmap.roadmap_data for nested display")
