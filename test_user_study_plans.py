import requests
import json

def test_user_study_plans():
    try:
        # Test the specific endpoint the frontend is calling
        response = requests.get('http://localhost:8000/api/roadmap/user_study_plans/')
        print(f"Status Code: {response.status_code}")
        print(f"Response Content: {response.text}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"JSON Data: {json.dumps(data, indent=2)}")
            except json.JSONDecodeError:
                print("Response is not valid JSON")
        else:
            print(f"API returned error: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("Cannot connect to the API - is the server running?")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_user_study_plans()
