#!/usr/bin/env python3

import os
import sys
import django
from dotenv import load_dotenv

print("🔄 Fresh test with updated API key...")

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Clear any cached environment variables
if 'GROQ_API_KEY' in os.environ:
    del os.environ['GROQ_API_KEY']

# Load fresh environment
load_dotenv(os.path.join('backend', 'key.env'))
api_key = os.getenv("GROQ_API_KEY")

print(f"🔑 API Key loaded: {api_key[:20]}...{api_key[-10:] if api_key else 'None'}")

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learning_roadmap_django.settings')
django.setup()

from roadmap.views import call_groq_api_for_roadmap

print("🧪 Testing GROQ API call with fresh environment...")

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
    main_topics = result.get("main_topics", [])
    roadmap_data = result.get("roadmap", [])
    print(f"📊 Main topics: {len(main_topics)} - {main_topics}")
    print(f"📊 Roadmap items: {len(roadmap_data)}")
    
    # Count subtopics
    total_subtopics = 0
    for item in roadmap_data:
        if isinstance(item, dict) and 'subtopics' in item:
            subtopics_count = len(item.get('subtopics', []))
            total_subtopics += subtopics_count
            print(f"   • {item.get('topic', 'Unknown')}: {subtopics_count} subtopics")
            
            # Show first few subtopics
            for subtopic in item.get('subtopics', [])[:2]:
                sub_id = subtopic.get('id', 'No ID')
                sub_topic = subtopic.get('topic', 'No topic')
                print(f"      └─ {sub_id}: {sub_topic}")
    
    print(f"🎯 Total subtopics: {total_subtopics}")
    
    if total_subtopics > 0:
        print(f"🎉 SUCCESS! Nested subtopics are being generated!")
    else:
        print(f"⚠️ No subtopics found - might be using fallback")
