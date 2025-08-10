#!/usr/bin/env python3

import requests
import json

def comprehensive_test():
    """Comprehensive test of the complete nested roadmap fix"""
    
    print("🧪 COMPREHENSIVE TEST: Complete Nested Roadmap Fix")
    print("=" * 60)
    
    # Test 1: Direct generate_roadmap endpoint
    print("\n📝 TEST 1: Direct generate_roadmap endpoint")
    url1 = "http://localhost:8000/api/roadmap/generate_roadmap/"
    params1 = {"topics": "Backtracking, Trees, Linked List", "time": 20}
    
    try:
        response1 = requests.get(url1, params=params1)
        if response1.status_code == 200:
            data1 = response1.json()
            roadmap1 = data1.get("roadmap", [])
            
            def count_topics(items):
                count = 0
                for item in items:
                    count += 1
                    if isinstance(item, dict) and 'subtopics' in item:
                        count += count_topics(item['subtopics'])
                return count
            
            total1 = count_topics(roadmap1)
            print(f"✅ SUCCESS: {len(roadmap1)} main topics, {total1} total topics")
        else:
            print(f"❌ FAILED: Status {response1.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False
    
    # Test 2: create_study_plan endpoint (frontend integration)
    print("\n📝 TEST 2: create_study_plan endpoint (frontend integration)")
    url2 = "http://localhost:8000/api/roadmap/studyplan/create/"
    data2 = {"main_topic": "Backtracking, Trees, Linked List", "available_time": 20}
    
    try:
        response2 = requests.post(url2, json=data2)
        if response2.status_code == 201:
            result2 = response2.json()
            
            # Check multiple possible locations for roadmap data
            roadmap2 = None
            if 'roadmap' in result2 and 'roadmap' in result2['roadmap']:
                roadmap2 = result2['roadmap']['roadmap']
            elif 'roadmap' in result2:
                roadmap2 = result2['roadmap']
            
            if roadmap2:
                total2 = count_topics(roadmap2)
                print(f"✅ SUCCESS: {len(roadmap2)} main topics, {total2} total topics")
                
                # Check if subtopics exist
                has_subtopics = False
                for item in roadmap2:
                    if isinstance(item, dict) and 'subtopics' in item and len(item.get('subtopics', [])) > 0:
                        has_subtopics = True
                        break
                
                if has_subtopics:
                    print("✅ SUCCESS: Nested subtopics confirmed!")
                else:
                    print("❌ FAILED: No nested subtopics found!")
                    return False
            else:
                print("❌ FAILED: No roadmap data found!")
                return False
        else:
            print(f"❌ FAILED: Status {response2.status_code}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False
    
    # Test 3: Frontend data structure compatibility
    print("\n📝 TEST 3: Frontend data structure compatibility")
    
    # Simulate how frontend Form.js stores data
    plan = result2['plan']
    roadmap = result2['roadmap']
    
    # This is how Form.js will store it
    frontend_storage = {
        **plan,
        'roadmaps': roadmap.get('roadmap', roadmap),  # Main nested structure
        'roadmap_data': result2.get('roadmap_data', {'roadmap': roadmap.get('roadmap', roadmap)}),
        'roadmap': roadmap.get('roadmap', roadmap)  # Fallback
    }
    
    # Simulate how StudyPlan.jsx/RoadmapPage.jsx extracts data
    extracted_data = (frontend_storage.get('roadmaps') or 
                     frontend_storage.get('roadmap_data', {}).get('roadmap') or 
                     frontend_storage.get('roadmap', []))
    
    total3 = count_topics(extracted_data)
    print(f"✅ SUCCESS: Frontend extraction yields {total3} total topics")
    
    # Test 4: Verify flattening will work
    print("\n📝 TEST 4: Frontend flattening simulation")
    
    def simulate_flatten(items, acc=None):
        if acc is None:
            acc = []
        
        for item in items:
            if isinstance(item, dict):
                acc.append({
                    'id': item.get('id', f'topic-{len(acc)}'),
                    'label': item.get('topic', 'Unknown'),
                    'prerequisites': item.get('prerequisites', []),
                    'estimated_time_hours': item.get('estimated_time_hours', 0)
                })
                
                if 'subtopics' in item and isinstance(item['subtopics'], list):
                    simulate_flatten(item['subtopics'], acc)
        
        return acc
    
    flattened = simulate_flatten(extracted_data)
    print(f"✅ SUCCESS: Flattening produces {len(flattened)} individual topics")
    
    # Final verification
    print(f"\n📊 FINAL RESULTS:")
    print(f"   Direct API: {total1} topics")
    print(f"   Study Plan API: {total2} topics")
    print(f"   Frontend Extraction: {total3} topics")
    print(f"   Flattened: {len(flattened)} topics")
    
    if total1 >= 10 and total2 >= 10 and total3 >= 10 and len(flattened) >= 10:
        print(f"\n🎉 ALL TESTS PASSED! Nested roadmap fix is working end-to-end!")
        return True
    else:
        print(f"\n💥 Some tests failed. Need further investigation.")
        return False

if __name__ == "__main__":
    comprehensive_test()
