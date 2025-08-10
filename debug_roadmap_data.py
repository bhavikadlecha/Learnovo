import requests
import json

def test_roadmap_endpoint():
    try:
        response = requests.get('http://localhost:8000/api/roadmap/user_study_plans/')
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Number of study plans: {len(data)}")
            
            # Check if any study plans have roadmap data
            for i, plan in enumerate(data):
                print(f"\nStudy Plan {i+1}:")
                print(f"  ID: {plan.get('id')}")
                print(f"  Topic: {plan.get('main_topic')}")
                print(f"  Has roadmaps: {'roadmaps' in plan}")
                print(f"  Has roadmap_data: {'roadmap_data' in plan}")
                
                if 'roadmaps' in plan:
                    print(f"  Roadmaps length: {len(plan['roadmaps'])}")
                if 'roadmap_data' in plan and plan['roadmap_data']:
                    print(f"  Roadmap_data type: {type(plan['roadmap_data'])}")
                    if isinstance(plan['roadmap_data'], dict) and 'roadmap' in plan['roadmap_data']:
                        print(f"  Roadmap length: {len(plan['roadmap_data']['roadmap'])}")
                        
                # Only show first 3 for brevity
                if i >= 2:
                    print(f"\n... and {len(data) - 3} more study plans")
                    break
                    
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_roadmap_endpoint()
