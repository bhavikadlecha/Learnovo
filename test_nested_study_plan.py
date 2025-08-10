import requests
import json

def test_study_plan_creation_and_nested_roadmap():
    """Test that study plan creation returns nested roadmap structure"""
    
    # Test data
    test_data = {
        "main_topic": "Backtracking, Trees, Linked List",
        "available_time": 10
    }
    
    print("🔬 Testing Study Plan Creation with Nested Roadmap...")
    print(f"📊 Request data: {test_data}")
    
    # Send request to create study plan
    try:
        response = requests.post(
            'http://localhost:8000/api/roadmap/studyplan/create/',
            json=test_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"📡 Response status: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print("✅ Study plan created successfully!")
            
            # Check response structure
            print(f"📋 Response keys: {list(data.keys())}")
            
            if 'roadmap' in data and 'roadmap' in data['roadmap']:
                roadmap_data = data['roadmap']['roadmap']
                print(f"📊 Roadmap data type: {type(roadmap_data)}")
                print(f"📊 Number of main topics: {len(roadmap_data)}")
                
                # Count total topics (including subtopics)
                total_topics = 0
                for i, topic in enumerate(roadmap_data):
                    total_topics += 1
                    print(f"\n{i+1}. Main Topic: {topic.get('topic', 'Unknown')}")
                    print(f"   ID: {topic.get('id', 'No ID')}")
                    print(f"   Time: {topic.get('estimated_time_hours', 0)} hours")
                    
                    if 'subtopics' in topic and topic['subtopics']:
                        print(f"   Subtopics ({len(topic['subtopics'])}):")
                        for j, subtopic in enumerate(topic['subtopics']):
                            total_topics += 1
                            print(f"     {i+1}.{j+1}. {subtopic.get('topic', 'Unknown')}")
                            print(f"          ID: {subtopic.get('id', 'No ID')}")
                            print(f"          Time: {subtopic.get('estimated_time_hours', 0)} hours")
                            print(f"          Prerequisites: {subtopic.get('prerequisites', [])}")
                    else:
                        print("   ❌ No subtopics found!")
                
                print(f"\n📊 SUMMARY:")
                print(f"   Total main topics: {len(roadmap_data)}")
                print(f"   Total topics (including subtopics): {total_topics}")
                
                if total_topics >= 12:  # 3 main + 9 subtopics
                    print("✅ SUCCESS: Complete nested structure detected!")
                    return True
                else:
                    print("❌ ISSUE: Missing subtopics in nested structure!")
                    return False
            else:
                print("❌ No roadmap data found in response!")
                return False
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing study plan creation: {e}")
        return False

if __name__ == "__main__":
    test_study_plan_creation_and_nested_roadmap()
