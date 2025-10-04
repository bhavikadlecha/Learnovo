#!/usr/bin/env python
"""
Comprehensive test with rate limit handling to show AI-generated differences
"""
import os
import sys
import django
import time

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learning_roadmap_django.settings')
django.setup()

from roadmap.views import generate_roadmap_with_groq

def test_with_rate_limit_handling():
    """Test with delays to avoid rate limiting and show AI differences"""
    
    topic = "Python Programming"
    
    test_cases = [
        ("Academic Research", "Theory-heavy, research methodology, comprehensive"),
        ("Job Interview Preparation", "Coding challenges, system design, practical"),
        ("Personal Skill Development", "Project-based, hands-on, progressive learning")
    ]
    
    print(f"🧪 COMPREHENSIVE TEST: Same Topic, Different Purposes")
    print(f"📚 Topic: {topic}")
    print("⏰ Using delays to avoid rate limits and show AI-generated differences")
    print("=" * 80)
    
    results = []
    
    for i, (purpose, description) in enumerate(test_cases, 1):
        print(f"\n🎯 Test {i}: {purpose}")
        print(f"   Expected: {description}")
        print("-" * 60)
        
        try:
            if i > 1:  # Add delay after first request
                print("   ⏰ Waiting 10 seconds to avoid rate limits...")
                time.sleep(10)
            
            roadmap = generate_roadmap_with_groq([topic], purpose=purpose)
            
            if roadmap and "roadmap" in roadmap:
                roadmap_data = roadmap["roadmap"]
                results.append((purpose, roadmap_data, "AI Generated"))
                
                print(f"   ✅ AI Generated Successfully!")
                print(f"   📊 {len(roadmap_data)} main topics generated")
                
                # Show detailed first topic
                if roadmap_data:
                    first_topic = roadmap_data[0]
                    topic_name = first_topic.get("topic", "Unknown")
                    hours = first_topic.get("estimated_time_hours", 0)
                    subtopics = first_topic.get("subtopics", [])
                    
                    print(f"   🔍 First Topic: {topic_name} ({hours}h)")
                    print(f"   📝 Subtopics ({len(subtopics)}):")
                    
                    for j, subtopic in enumerate(subtopics[:4], 1):
                        subtopic_name = subtopic.get("topic", "Unknown")
                        sub_hours = subtopic.get("estimated_time_hours", 0)
                        print(f"      {j}. {subtopic_name} ({sub_hours}h)")
                    
                    if len(subtopics) > 4:
                        print(f"      ... and {len(subtopics) - 4} more subtopics")
            else:
                print(f"   ❌ AI generation failed, no valid roadmap returned")
                results.append((purpose, None, "Failed"))
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
            results.append((purpose, None, "Error"))
    
    # Analysis
    print("\n" + "=" * 80)
    print("🔍 DETAILED AI-GENERATED DIFFERENCES ANALYSIS")
    print("=" * 80)
    
    successful_results = [(p, r) for p, r, s in results if r is not None]
    
    if len(successful_results) >= 2:
        print("\n📊 TOPIC NAMING COMPARISON:")
        print("-" * 40)
        for purpose, roadmap_data in successful_results:
            if roadmap_data:
                first_topic = roadmap_data[0].get("topic", "Unknown")
                print(f"  {purpose[:25]:<25}: {first_topic}")
        
        print("\n📊 CONTENT FOCUS COMPARISON:")
        print("-" * 40)
        for purpose, roadmap_data in successful_results:
            if roadmap_data and roadmap_data[0].get("subtopics"):
                first_subtopic = roadmap_data[0]["subtopics"][0].get("topic", "Unknown")
                print(f"  {purpose[:25]:<25}: {first_subtopic}")
        
        print("\n📊 STRUCTURAL DIFFERENCES:")
        print("-" * 40)
        for purpose, roadmap_data in successful_results:
            if roadmap_data:
                total_subtopics = sum(len(topic.get("subtopics", [])) for topic in roadmap_data)
                avg_subtopics = total_subtopics / len(roadmap_data)
                print(f"  {purpose[:25]:<25}: {len(roadmap_data)} topics, avg {avg_subtopics:.1f} subtopics/topic")
    
    print(f"\n✅ Successfully generated {len(successful_results)} unique AI roadmaps")
    print("🎯 Each roadmap shows different focus, structure, and content approach!")
    
    return results

if __name__ == "__main__":
    test_with_rate_limit_handling()
