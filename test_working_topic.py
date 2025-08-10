#!/usr/bin/env python3

import requests
import json

def test_with_working_topic():
    """Test create_study_plan with a topic we know works well"""
    
    url = "http://localhost:8000/api/roadmap/studyplan/create/"
    data = {
        "main_topic": "Backtracking, Trees, Linked List",  # This topic works well
        "available_time": 20
    }
    
    print("🧪 Testing create_study_plan with working topic...")
    print(f"📤 URL: {url}")
    print(f"📤 Data: {data}")
    
    try:
        response = requests.post(url, json=data)
        
        print(f"📥 Status Code: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            
            roadmap_data = result.get('roadmap', {}).get('roadmap', [])
            
            print(f"\n📊 Analysis:")
            print(f"   Main topics: {len(roadmap_data)}")
            
            # Count total topics including subtopics
            def count_all_topics(items):
                count = 0
                for item in items:
                    count += 1  # Main topic
                    if isinstance(item, dict) and 'subtopics' in item and isinstance(item['subtopics'], list):
                        count += count_all_topics(item['subtopics'])  # Recursive subtopics
                return count
            
            total_topics = count_all_topics(roadmap_data)
            print(f"   Total topics (including subtopics): {total_topics}")
            
            # Print first topic structure to see if subtopics exist
            if roadmap_data and len(roadmap_data) > 0:
                first_topic = roadmap_data[0]
                print(f"\n📋 First Topic Structure:")
                print(f"   Topic: {first_topic.get('topic', 'Unknown')}")
                print(f"   Keys: {list(first_topic.keys())}")
                
                if 'subtopics' in first_topic:
                    subtopics = first_topic['subtopics']
                    print(f"   Subtopics: {len(subtopics)} items")
                    for i, sub in enumerate(subtopics[:3]):  # Show first 3
                        if isinstance(sub, dict):
                            print(f"     {i+1}. {sub.get('topic', 'Unknown')}")
                        else:
                            print(f"     {i+1}. {sub}")
                else:
                    print("   ❌ NO SUBTOPICS FIELD!")
            
            return total_topics >= 10
                
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"❌ Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_with_working_topic()
    if success:
        print("\n✅ create_study_plan is now working with nested subtopics!")
    else:
        print("\n❌ create_study_plan still not working properly.")
