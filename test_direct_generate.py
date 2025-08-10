#!/usr/bin/env python3

import requests
import json

def test_direct_generate_roadmap():
    """Test the generate_roadmap endpoint directly"""
    
    url = "http://localhost:8001/api/roadmap/generate_roadmap/"
    params = {
        "topics": "Backtracking, Trees, Linked List",
        "time": 20
    }
    
    print("🧪 Testing generate_roadmap endpoint directly...")
    print(f"📤 URL: {url}")
    print(f"📤 Params: {params}")
    
    try:
        response = requests.get(url, params=params)
        
        print(f"📥 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            roadmap_data = result.get('roadmap', [])
            
            print(f"\n📊 Direct generate_roadmap Analysis:")
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
            
            # Print structure details
            print(f"\n📋 Roadmap Structure:")
            for i, item in enumerate(roadmap_data):
                if isinstance(item, dict):
                    topic_name = item.get('topic', f'Topic {i+1}')
                    subtopics_count = len(item.get('subtopics', []))
                    print(f"   {i+1}. {topic_name}")
                    print(f"      └─ Subtopics: {subtopics_count}")
                    
                    # Show subtopic details
                    for j, subtopic in enumerate(item.get('subtopics', [])):
                        if isinstance(subtopic, dict):
                            subtopic_name = subtopic.get('topic', f'Subtopic {j+1}')
                            print(f"         {j+1}. {subtopic_name}")
                        else:
                            print(f"         {j+1}. {subtopic}")
                else:
                    print(f"   {i+1}. {item}")
            
            return total_topics >= 10  # Expect at least 10 topics
                
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"❌ Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_direct_generate_roadmap()
    if success:
        print("\n✅ Direct generate_roadmap endpoint is working with nested subtopics!")
    else:
        print("\n❌ Direct generate_roadmap endpoint failed!")
