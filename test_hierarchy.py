import requests
import json

# Test creating a roadmap that will have hierarchical structure
form_data = {
    "subject": "Computer Science",
    "topic": "Data Structures and Algorithms",
    "proficiency": "Beginner",
    "weeklyHours": 15,
    "deadline": "2025-12-31",
    "user_id": 1
}

try:
    print("🧪 Testing hierarchical roadmap creation...")
    response = requests.post('http://localhost:8000/api/roadmap/create_from_form/', json=form_data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 201:
        data = response.json()
        print(f"✅ Roadmap created: {data['message']}")
        
        # Show the hierarchical structure
        roadmap = data['roadmap']['roadmap']
        print(f"\n🌳 Hierarchical Structure:")
        print(f"Main Topic: {data['roadmap']['main_topic']}")
        print(f"Total Items: {len(roadmap)}")
        
        def print_hierarchy(items, level=0):
            for item in items:
                indent = "  " * level
                prereq_text = f" (requires: {', '.join(item.get('prerequisites', []))})" if item.get('prerequisites') else ""
                print(f"{indent}├─ {item['topic']} [{item['estimated_time_hours']}h]{prereq_text}")
                
                if 'subtopics' in item:
                    print_hierarchy(item['subtopics'], level + 1)
        
        print_hierarchy(roadmap)
        
        # Test fetching all user roadmaps
        print(f"\n📋 Fetching all user roadmaps...")
        roadmaps_response = requests.get('http://localhost:8000/api/roadmap/user_roadmaps/')
        all_roadmaps = roadmaps_response.json().get('roadmaps', [])
        
        print(f"Total user roadmaps: {len(all_roadmaps)}")
        for rm in all_roadmaps:
            items_count = len(rm.get('roadmap_data', {}).get('roadmap', []))
            print(f"  - {rm['title']} ({rm['proficiency']}) - {items_count} topics")
            
    else:
        print(f"❌ Error: {response.text}")
        
except Exception as e:
    print(f"💥 Error: {e}")
