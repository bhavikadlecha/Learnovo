#!/usr/bin/env python
"""
Test script to verify that SAME TOPIC with DIFFERENT PURPOSES produces DIFFERENT outputs
"""
import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learning_roadmap_django.settings')
django.setup()

from roadmap.views import generate_roadmap_with_groq, get_fallback_roadmap

def test_same_topic_different_purposes():
    """Test that the SAME topic with DIFFERENT purposes produces DIFFERENT roadmaps"""
    
    # Same topic for all tests
    topic = "Machine Learning"
    
    # Different purposes
    test_cases = [
        {
            "purpose": "Academic Research",
            "description": "Should be theory-heavy, research-focused, comprehensive"
        },
        {
            "purpose": "Job Interview Preparation", 
            "description": "Should be practical, interview-focused, industry-relevant"
        },
        {
            "purpose": "Personal Skill Development",
            "description": "Should be project-based, hands-on, progressive"
        },
        {
            "purpose": "Competitive Programming",
            "description": "Should be algorithm-focused, problem-solving oriented"
        },
        {
            "purpose": "Personal Learning",
            "description": "Should be balanced, self-paced, engaging"
        }
    ]
    
    print(f"🧪 TESTING SAME TOPIC WITH DIFFERENT PURPOSES")
    print(f"📚 Topic: {topic}")
    print("=" * 80)
    
    results = []
    
    for i, test_case in enumerate(test_cases, 1):
        purpose = test_case["purpose"]
        expected = test_case["description"]
        
        print(f"\n🎯 Test {i}: {purpose}")
        print(f"   Expected: {expected}")
        print("-" * 60)
        
        try:
            # Try AI generation first
            roadmap = generate_roadmap_with_groq([topic], purpose=purpose)
            source = "AI Generated"
            
            if not roadmap or "roadmap" not in roadmap:
                # Fallback to template
                roadmap = get_fallback_roadmap([topic], purpose)
                source = "Fallback Template"
            
            roadmap_data = roadmap["roadmap"]
            results.append({
                "purpose": purpose,
                "roadmap": roadmap_data,
                "source": source
            })
            
            print(f"   ✅ Source: {source}")
            print(f"   📊 Generated {len(roadmap_data)} main topics")
            
            # Show first 3 topics to demonstrate uniqueness
            for j, topic_item in enumerate(roadmap_data[:3]):
                topic_name = topic_item.get("topic", "Unknown")
                hours = topic_item.get("estimated_time_hours", 0)
                subtopics = topic_item.get("subtopics", [])
                
                print(f"   {j+1}. {topic_name} ({hours}h)")
                
                # Show first 2 subtopics
                for k, subtopic in enumerate(subtopics[:2]):
                    subtopic_name = subtopic.get("topic", "Unknown")
                    print(f"      - {subtopic_name}")
                
                if len(subtopics) > 2:
                    print(f"      ... and {len(subtopics) - 2} more subtopics")
            
            if len(roadmap_data) > 3:
                print(f"   ... and {len(roadmap_data) - 3} more main topics")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
            results.append({
                "purpose": purpose,
                "error": str(e),
                "source": "Error"
            })
    
    # Analyze differences
    print("\n" + "=" * 80)
    print("🔍 DETAILED COMPARISON ANALYSIS")
    print("=" * 80)
    
    if len(results) >= 2:
        print("\n📋 FIRST TOPIC COMPARISON:")
        print("-" * 40)
        for result in results:
            if "error" not in result and result["roadmap"]:
                first_topic = result["roadmap"][0].get("topic", "Unknown")
                purpose = result["purpose"]
                print(f"  {purpose[:20]:<20}: {first_topic}")
        
        print("\n📋 SUBTOPIC STYLE COMPARISON:")
        print("-" * 40)
        for result in results:
            if "error" not in result and result["roadmap"]:
                first_topic = result["roadmap"][0]
                subtopics = first_topic.get("subtopics", [])
                if subtopics:
                    first_subtopic = subtopics[0].get("topic", "Unknown")
                    purpose = result["purpose"]
                    print(f"  {purpose[:20]:<20}: {first_subtopic}")
        
        print("\n📋 STRUCTURE COMPARISON:")
        print("-" * 40)
        for result in results:
            if "error" not in result and result["roadmap"]:
                roadmap_data = result["roadmap"]
                total_subtopics = sum(len(topic.get("subtopics", [])) for topic in roadmap_data)
                total_hours = sum(
                    topic.get("estimated_time_hours", 0) + 
                    sum(sub.get("estimated_time_hours", 0) for sub in topic.get("subtopics", []))
                    for topic in roadmap_data
                )
                purpose = result["purpose"]
                print(f"  {purpose[:20]:<20}: {len(roadmap_data)} topics, {total_subtopics} subtopics, {total_hours:.1f}h")
    
    # Uniqueness Analysis
    print("\n" + "=" * 80)
    print("🎯 UNIQUENESS VERIFICATION")
    print("=" * 80)
    
    # Check if first topics are different
    first_topics = []
    for result in results:
        if "error" not in result and result["roadmap"]:
            first_topic = result["roadmap"][0].get("topic", "").lower()
            first_topics.append(first_topic)
    
    unique_first_topics = len(set(first_topics))
    total_valid_results = len([r for r in results if "error" not in r])
    
    print(f"📊 Unique first topics: {unique_first_topics}/{total_valid_results}")
    
    if unique_first_topics == total_valid_results:
        print("✅ EXCELLENT: All purposes generated completely different first topics!")
    elif unique_first_topics >= total_valid_results * 0.8:
        print("✅ GOOD: Most purposes generated different first topics!")
    else:
        print("⚠️  WARNING: Some purposes generated similar first topics!")
    
    # Check if any roadmaps are identical
    roadmap_signatures = []
    for result in results:
        if "error" not in result and result["roadmap"]:
            # Create signature from first 3 topic names
            topics = [topic.get("topic", "") for topic in result["roadmap"][:3]]
            signature = "|".join(topics).lower()
            roadmap_signatures.append(signature)
    
    unique_signatures = len(set(roadmap_signatures))
    print(f"📊 Unique roadmap structures: {unique_signatures}/{len(roadmap_signatures)}")
    
    if unique_signatures == len(roadmap_signatures):
        print("✅ PERFECT: All roadmaps have completely different structures!")
    else:
        print("⚠️  Some roadmaps have similar structures!")
    
    print("\n🏁 Same Topic, Different Purpose Test Completed!")
    
    return results

if __name__ == "__main__":
    test_same_topic_different_purposes()
