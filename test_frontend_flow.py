import requests
import json

def test_frontend_data_flow():
    """Test the complete data flow: API -> localStorage format -> frontend processing"""
    
    print("🔬 Testing Complete Frontend Data Flow...")
    
    # Step 1: Create study plan (simulating Form.js)
    print("\n📝 Step 1: Creating study plan...")
    test_data = {
        "main_topic": "Backtracking, Trees, Linked List",
        "available_time": 10
    }
    
    response = requests.post(
        'http://localhost:8000/api/roadmap/studyplan/create/',
        json=test_data,
        headers={'Content-Type': 'application/json'}
    )
    
    if response.status_code != 201:
        print(f"❌ Failed to create study plan: {response.status_code}")
        return False
    
    data = response.json()
    plan = data['plan']
    roadmap = data['roadmap']
    
    # Step 2: Simulate localStorage storage (from Form.js line 38-39)
    print("\n💾 Step 2: Simulating localStorage storage...")
    localStorage_data = {**plan, 'roadmaps': roadmap['roadmap']}
    
    print(f"📊 Plan ID: {plan['id']}")
    print(f"📊 Main topic: {plan['main_topic']}")
    print(f"📊 Roadmaps type: {type(localStorage_data['roadmaps'])}")
    print(f"📊 Roadmaps length: {len(localStorage_data['roadmaps'])}")
    
    # Step 3: Simulate frontend data extraction (StudyPlan.jsx/RoadmapPage.jsx)
    print("\n🎯 Step 3: Simulating frontend data extraction...")
    # Priority: roadmaps (localStorage) -> roadmap_data.roadmap (API) -> roadmap (fallback)
    extracted_roadmapData = (localStorage_data.get('roadmaps') or 
                            localStorage_data.get('roadmap_data', {}).get('roadmap') or 
                            localStorage_data.get('roadmap', []))
    
    print(f"📊 Extracted data type: {type(extracted_roadmapData)}")
    print(f"📊 Extracted data length: {len(extracted_roadmapData)}")
    
    # Step 4: Simulate flattenRoadmap function
    print("\n🔄 Step 4: Simulating flattenRoadmap function...")
    
    def flattenRoadmap_simulation(items, acc=None, visited=None, level=0):
        if acc is None:
            acc = []
        if visited is None:
            visited = set()
        
        indent = '  ' * level
        print(f"{indent}🔄 Flattening level {level}, items: {len(items) if items else 0}")
        
        if not isinstance(items, list):
            print(f"{indent}❌ Items is not a list: {type(items)}")
            return acc
        
        for item in items:
            item_id = str(item.get('id', f'topic-{len(acc)}'))
            topic = item.get('topic', 'Unknown Topic')
            
            print(f"{indent}📝 Processing: {topic} (ID: {item_id})")
            
            if item_id in visited:
                print(f"{indent}⚠️ Skipping duplicate ID: {item_id}")
                continue
            
            visited.add(item_id)
            
            # Add to flattened array
            flat_item = {
                'id': item_id,
                'label': topic,
                'prerequisites': item.get('prerequisites', []),
                'estimated_time_minutes': round((item.get('estimated_time_hours', 0)) * 60),
                'estimated_time_hours': item.get('estimated_time_hours', 0)
            }
            
            acc.append(flat_item)
            print(f"{indent}✅ Added: {topic} ({item_id})")
            
            # Process subtopics recursively
            if 'subtopics' in item and isinstance(item['subtopics'], list) and item['subtopics']:
                print(f"{indent}🔄 Found {len(item['subtopics'])} subtopics, recursing...")
                flattenRoadmap_simulation(item['subtopics'], acc, visited, level + 1)
            else:
                print(f"{indent}📝 No subtopics for {topic}")
        
        if level == 0:
            print(f"\n✅ Final flattened result: {len(acc)} total items")
            for i, item in enumerate(acc):
                print(f"  {i+1}. {item['label']} ({item['id']}) - {item['estimated_time_minutes']}min")
        
        return acc
    
    flattened = flattenRoadmap_simulation(extracted_roadmapData)
    
    # Step 5: Results summary
    print(f"\n📊 FINAL RESULTS:")
    print(f"   Original nested structure: {len(extracted_roadmapData)} main topics")
    
    total_subtopics = sum(len(item.get('subtopics', [])) for item in extracted_roadmapData)
    expected_total = len(extracted_roadmapData) + total_subtopics
    
    print(f"   Total subtopics: {total_subtopics}")
    print(f"   Expected flattened items: {expected_total}")
    print(f"   Actual flattened items: {len(flattened)}")
    
    if len(flattened) == expected_total:
        print("✅ SUCCESS: All nested items properly flattened!")
        return True
    else:
        print("❌ ISSUE: Some items were lost during flattening!")
        return False

if __name__ == "__main__":
    test_frontend_data_flow()
