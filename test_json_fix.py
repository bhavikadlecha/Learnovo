#!/usr/bin/env python3

# Test to demonstrate the JSON parsing issue and fix it

import json
import re

# This is the raw output from GROQ (simplified)
raw_output = """
{
  "main_topics": ['Backtracking', 'Trees', 'Linked List'],
  "roadmap": [
    {
      "id": "1",
      "topic": "Tree",
      "estimated_time_hours": 4,
      "prerequisites": [],
      "subtopics": [
        {
          "id": "1.1",
          "topic": "DFS",
          "estimated_time_hours": 3,
          "prerequisites": ["1"]
        },
        {
          "id": "1.2",
          "topic": "BFS", 
          "estimated_time_hours": 3,
          "prerequisites": ["1"]
        }
      ]
    }
  ]
}
"""

print("🔧 Original raw output (with single quotes in array):")
print(raw_output[:200] + "...")

# Fix the JSON
def fix_json(text):
    # Simple approach: replace all single quotes with double quotes
    fixed = text.replace("'", '"')
    return fixed

fixed_output = fix_json(raw_output)
print("\n🔧 Fixed output:")
print(fixed_output[:200] + "...")

try:
    parsed = json.loads(fixed_output)
    print("\n✅ SUCCESS: JSON parsed successfully!")
    print(f"📊 Main topics: {len(parsed['main_topics'])}")
    print(f"📊 Roadmap items: {len(parsed['roadmap'])}")
    print(f"📊 First item subtopics: {len(parsed['roadmap'][0]['subtopics'])}")
    
    # Count total nested items
    def count_all_items(items):
        count = 0
        for item in items:
            count += 1
            if 'subtopics' in item:
                count += count_all_items(item['subtopics'])
        return count
    
    total = count_all_items(parsed['roadmap'])
    print(f"📊 Total topics (including nested): {total}")
    
except json.JSONDecodeError as e:
    print(f"\n❌ FAILED: {e}")
