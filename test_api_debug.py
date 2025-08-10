import requests
import json

def test_api():
    try:
        response = requests.get('http://localhost:8000/api/roadmap/user_study_plans/')
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {response.headers}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Data type: {type(data)}")
            print(f"Data length: {len(data) if isinstance(data, list) else 'Not a list'}")
            
            if isinstance(data, list) and len(data) > 0:
                print(f"First item: {json.dumps(data[0], indent=2)}")
            else:
                print(f"Full data: {json.dumps(data, indent=2)}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_api()
