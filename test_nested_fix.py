#!/usr/bin/env python3

import requests
import json

def test_nested_study_plan_fix():
    """Test the fixed create_study_plan endpoint for nested subtopics"""
    
    url = "http://localhost:8000/api/roadmap/studyplan/create/"
    data = {
        "main_topic": "Backtracking, Trees, Linked List",
        "available_time": 20
    }
    
    print("🧪 Testing fixed create_study_plan endpoint...")
    print(f"📤 Request: {url}")
    print(f"📤 Data: {data}")
    
    try:
        response = requests.post(url, json=data)
        
        print(f"📥 Status Code: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            
            print("\n✅ SUCCESS! Study plan created.")
            print(f"📋 Plan ID: {result['plan']['id']}")
            print(f"📋 Main Topic: {result['plan']['main_topic']}")
            
            # Check roadmap structure
            roadmap_data = result.get('roadmap', [])
            roadmap_data_alt = result.get('roadmap_data', {}).get('roadmap', [])
            
            print(f"\n📊 Roadmap Analysis:")
            print(f"   Direct roadmap items: {len(roadmap_data)}")
            print(f"   Alt roadmap_data items: {len(roadmap_data_alt)}")
            
            # Count total topics including subtopics
            def count_all_topics(items):
                count = 0
                for item in items:
                    count += 1  # Main topic
                    if 'subtopics' in item and isinstance(item['subtopics'], list):
                        count += count_all_topics(item['subtopics'])  # Recursive subtopics
                return count
            
            total_topics = count_all_topics(roadmap_data)
            total_topics_alt = count_all_topics(roadmap_data_alt)
            
            print(f"   Total topics (including subtopics): {total_topics}")
            print(f"   Alt total topics: {total_topics_alt}")
            
            # Print structure details
            print(f"\n📋 Roadmap Structure:")
            for i, item in enumerate(roadmap_data):
                topic_name = item.get('topic', f'Topic {i+1}')
                subtopics_count = len(item.get('subtopics', []))
                print(f"   {i+1}. {topic_name}")
                print(f"      └─ Subtopics: {subtopics_count}")
                
                # Show subtopic details
                for j, subtopic in enumerate(item.get('subtopics', [])):
                    subtopic_name = subtopic.get('topic', f'Subtopic {j+1}')
                    print(f"         {j+1}. {subtopic_name}")
            
            # Expected vs Actual
            expected_total = 13  # Based on our previous tests
            if total_topics >= expected_total:
                print(f"\n✅ PASSED: Found {total_topics} topics (expected ≥{expected_total})")
                return True
            else:
                print(f"\n❌ FAILED: Found only {total_topics} topics (expected ≥{expected_total})")
                return False
                
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"❌ Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_nested_study_plan_fix()
    if success:
        print("\n🎉 All tests PASSED! The nested subtopic fix is working.")
    else:
        print("\n💥 Tests FAILED! Need to investigate further.")
