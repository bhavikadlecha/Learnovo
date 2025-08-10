#!/usr/bin/env python3

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learning_roadmap_django.settings')
django.setup()

from roadmap.views import call_groq_api_for_roadmap

print("🧪 Testing GROQ API call directly...")

# Test the exact same call that create_study_plan would make
topics_list = ['Backtracking', 'Trees', 'Linked List']
available_time = 40

print(f"📤 Calling GROQ API with: topics={topics_list}, time={available_time}")

result = call_groq_api_for_roadmap(topics_list, available_time)

print(f"📥 Result type: {type(result)}")
print(f"📥 Result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")

if "error" in result:
    print(f"❌ GROQ API Error: {result['error']}")
    if 'details' in result:
        print(f"📄 Details: {result['details']}")
    if 'raw_output' in result:
        print(f"📄 Raw output: {result['raw_output'][:500]}...")
    if 'json_error' in result:
        print(f"📄 JSON Error: {result['json_error']}")
else:
    print(f"✅ GROQ API Success!")
    roadmap_data = result.get("roadmap", [])
    print(f"📊 Main topics: {len(roadmap_data)}")
    
    # Count subtopics
    total_subtopics = 0
    for item in roadmap_data:
        if isinstance(item, dict) and 'subtopics' in item:
            subtopics_count = len(item.get('subtopics', []))
            total_subtopics += subtopics_count
            print(f"   • {item.get('topic', 'Unknown')}: {subtopics_count} subtopics")
    
    print(f"📊 Total subtopics: {total_subtopics}")
    
    if roadmap_data:
        print(f"🔍 First item structure: {list(roadmap_data[0].keys())}")
        if 'subtopics' in roadmap_data[0]:
            print(f"🔍 First item has {len(roadmap_data[0]['subtopics'])} subtopics")
