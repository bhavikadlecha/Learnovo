import requests
import json

# Test the notebook mind map with a machine learning roadmap
def test_ml_roadmap():
    print("🧠 Testing ML Learning Notebook Creation...")
    
    # Create a comprehensive ML roadmap
    roadmap_data = {
        "subject": "Machine Learning",
        "topic": "Complete Machine Learning Path",
        "proficiency": "Beginner",
        "weeklyHours": 15,
        "deadline": None,
        "user_id": 1
    }
    
    try:
        # Create roadmap via API
        response = requests.post(
            'http://localhost:8000/api/roadmap/create_from_form/',
            json=roadmap_data
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Roadmap created: {result['message']}")
            
            # Display full response for debugging
            print(f"\n📊 Full API Response:")
            print(json.dumps(result, indent=2))
            
            # Display roadmap structure for notebook
            roadmap = result.get('roadmap', {})
            roadmap_items = roadmap.get('roadmap', [])  # Changed from roadmap_data.roadmap
            
            print(f"\n🌳 Notebook-Ready Roadmap Structure:")
            print(f"Title: {roadmap.get('main_topic', 'ML Learning Path')}")  # Changed from title
            print(f"Total Topics: {len(roadmap_items)}")
            
            for i, item in enumerate(roadmap_items[:5]):  # Show first 5 topics
                title = item.get('topic', item.get('title', f'Topic {i+1}'))
                hours = item.get('estimated_time_hours', item.get('time_hours', 0))
                subtopics = item.get('subtopics', [])
                print(f"  📚 {title} ({hours}h)")
                for subtopic in subtopics[:2]:  # Show first 2 subtopics
                    sub_title = subtopic.get('topic', 'Subtopic')
                    sub_hours = subtopic.get('estimated_time_hours', 0)
                    print(f"    └─ {sub_title} ({sub_hours}h)")
            
            if len(roadmap_items) > 5:
                print(f"  ... and {len(roadmap_items) - 5} more topics")
                
            print(f"\n🎯 Perfect for ML Learning Notebook Display!")
            
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_ml_roadmap()
