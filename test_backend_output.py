import requests
import json

# Test the backend API to see what data it's generating
topics = ["Backtracking", "Trees", "Linked List"]
topics_str = ",".join(topics)
url = f"http://127.0.0.1:8000/api/roadmap/generate_roadmap/?topics={topics_str}"

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        roadmap_data = response.json()
        print("\n=== BACKEND RESPONSE ===")
        print(json.dumps(roadmap_data, indent=2))
        
        # Check structure
        if 'roadmap' in roadmap_data:
            roadmap = roadmap_data['roadmap']
            print(f"\n=== ROADMAP ANALYSIS ===")
            print(f"Roadmap type: {type(roadmap)}")
            print(f"Roadmap length: {len(roadmap) if isinstance(roadmap, list) else 'N/A'}")
            
            if isinstance(roadmap, list):
                print(f"Number of main topics: {len(roadmap)}")
                for i, topic in enumerate(roadmap):
                    print(f"Topic {i+1}: {topic.get('topic', 'N/A')}")
                    if 'subtopics' in topic:
                        print(f"  - Subtopics: {len(topic['subtopics'])}")
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Error connecting to backend: {e}")
