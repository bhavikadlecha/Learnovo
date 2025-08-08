import requests
import json

# Test form submission to create roadmap
form_data = {
    "subject": "Programming",
    "topic": "Python",
    "proficiency": "Beginner",
    "weeklyHours": 10,
    "deadline": "2025-09-30",
    "user_id": 1
}

try:
    print("Testing form submission to create roadmap...")
    response = requests.post('http://localhost:8000/api/roadmap/create_from_form/', json=form_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 201:
        print("\n✅ Roadmap created successfully!")
        roadmap_id = response.json().get('roadmap_id')
        
        # Test fetching user roadmaps
        print("\nTesting user roadmaps retrieval...")
        user_roadmaps_response = requests.get('http://localhost:8000/api/roadmap/user_roadmaps/')
        print(f"User Roadmaps Status: {user_roadmaps_response.status_code}")
        roadmaps = user_roadmaps_response.json().get('roadmaps', [])
        print(f"Number of user roadmaps: {len(roadmaps)}")
        
        for roadmap in roadmaps:
            print(f"- {roadmap['title']} ({roadmap['proficiency']}) - {roadmap['subject']}")
    
except Exception as e:
    print(f"Error: {e}")
