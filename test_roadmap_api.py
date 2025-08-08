import requests
import json

# Test the new roadmap cards endpoint
try:
    response = requests.get('http://localhost:8000/api/roadmap/roadmap_cards/')
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")

# Test roadmap generation
try:
    response = requests.get('http://localhost:8000/api/roadmap/generate_roadmap/', 
                          params={'topic': 'Python Programming', 'time': '50', 'user_id': '1'})
    print(f"\nRoadmap Generation Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Main Topic: {data.get('main_topic')}")
        print(f"Number of roadmap items: {len(data.get('roadmap', []))}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Error: {e}")
