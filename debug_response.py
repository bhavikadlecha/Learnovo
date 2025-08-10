#!/usr/bin/env python3

import requests
import json

def debug_study_plan_response():
    """Debug the create_study_plan endpoint response structure"""
    
    url = "http://localhost:8000/api/roadmap/studyplan/create/"
    data = {
        "main_topic": "Python, Django",
        "available_time": 10
    }
    
    print("🔍 Debugging create_study_plan response...")
    
    try:
        response = requests.post(url, json=data)
        
        print(f"📥 Status Code: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            
            print(f"\n📋 Full Response Structure:")
            print(json.dumps(result, indent=2))
            
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"❌ Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_study_plan_response()
