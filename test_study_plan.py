import requests
import json

# Test the study plan creation endpoint 
def test_study_plan_creation():
    # First, login to get a token
    login_url = "http://localhost:8000/api/users/login/"
    login_data = {
        "identifier": "newuser2025@example.com",
        "password": "testpass123"
    }
    
    try:
        login_response = requests.post(login_url, json=login_data)
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            return False
            
        token = login_response.json()['token']
        print(f"✅ Login successful, token: {token[:20]}...")
        
        # Now test study plan creation
        study_plan_url = "http://localhost:8000/api/roadmap/studyplan/create/"
        headers = {
            "Authorization": f"Token {token}",
            "Content-Type": "application/json"
        }
        
        study_plan_data = {
            "main_topic": "Backtracking, Trees, Linked List",
            "available_time": 40
        }
        
        print(f"📤 Creating study plan with: {study_plan_data}")
        
        response = requests.post(study_plan_url, json=study_plan_data, headers=headers)
        print(f"📥 Study Plan Status Code: {response.status_code}")
        
        if response.status_code == 201:
            plan_data = response.json()
            print(f"✅ Study Plan Created Successfully!")
            print(f"� Full Response Keys: {list(plan_data.keys())}")
            print(f"�📊 Plan Data: {plan_data.get('plan', {})}")
            print(f"📊 Roadmap Keys: {list(plan_data.get('roadmap', {}).keys()) if plan_data.get('roadmap') else 'No roadmap key'}")
            
            # Check for roadmap data in different locations
            roadmap = plan_data.get('roadmap_data', {})
            if not roadmap:
                roadmap = plan_data.get('roadmap', {})
            if roadmap:
                main_topics = roadmap.get('main_topics', [])
                roadmap_items = roadmap.get('roadmap', [])
                
                print(f"🗺️ Main Topics ({len(main_topics)}): {main_topics}")
                print(f"🗺️ Roadmap Items: {len(roadmap_items)}")
                
                # Count total topics including subtopics
                def count_all_topics(items):
                    count = 0
                    for item in items:
                        count += 1
                        if 'subtopics' in item and item['subtopics']:
                            count += count_all_topics(item['subtopics'])
                    return count
                
                total_topics = count_all_topics(roadmap_items)
                print(f"🗺️ Total Topics (including subtopics): {total_topics}")
                
                # Show first item structure
                if roadmap_items:
                    first_item = roadmap_items[0]
                    print(f"🔍 First Topic: {first_item.get('topic')}")
                    if 'subtopics' in first_item:
                        print(f"   └─ Subtopics: {len(first_item['subtopics'])}")
                        for sub in first_item['subtopics'][:3]:  # Show first 3
                            print(f"      • {sub.get('topic')} (ID: {sub.get('id')})")
            
            return True
        else:
            print(f"❌ Study Plan Creation Failed")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Study Plan Creation...")
    test_study_plan_creation()
