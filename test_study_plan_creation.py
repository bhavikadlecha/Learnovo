import requests
import json

# Test the study plan creation endpoint
url = "http://127.0.0.1:8000/api/roadmap/studyplan/create/"
data = {
    "main_topic": "Backtracking,Trees,Linked List",
    "available_time": 20
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 201:
        result = response.json()
        print("\n=== STUDY PLAN CREATION RESPONSE ===")
        print(json.dumps(result, indent=2))
        
        # Analyze the roadmap structure
        if 'roadmap' in result:
            roadmap_data = result['roadmap'].get('roadmap', [])
            print(f"\n=== ROADMAP ANALYSIS ===")
            print(f"Number of roadmap items: {len(roadmap_data)}")
            
            for i, item in enumerate(roadmap_data):
                print(f"\nItem {i+1}:")
                print(f"  ID: {item.get('id')}")
                print(f"  Topic: {item.get('topic')}")
                print(f"  Hours: {item.get('estimated_time_hours')}")
                print(f"  Has subtopics: {'subtopics' in item}")
                
                if 'subtopics' in item:
                    subtopics = item['subtopics']
                    print(f"  Subtopics count: {len(subtopics)}")
                    for j, sub in enumerate(subtopics):
                        print(f"    Subtopic {j+1}: {sub.get('topic')} (ID: {sub.get('id')})")
                        if 'subtopics' in sub:
                            print(f"      Has deeper subtopics: {len(sub['subtopics'])}")
                            for k, deep in enumerate(sub['subtopics']):
                                print(f"        Deep {k+1}: {deep.get('topic')} (ID: {deep.get('id')})")
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Error: {e}")
