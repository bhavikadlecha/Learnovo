// Test data structure (based on our backend test results)
const testRoadmapData = [
  {
    "id": "1",
    "topic": "Backtracking",
    "estimated_time_hours": 3.08,
    "prerequisites": [],
    "subtopics": [
      {
        "id": "1.1",
        "topic": "Backtracking Basics",
        "estimated_time_hours": 0.77,
        "prerequisites": [],
        "subtopics": []
      },
      {
        "id": "1.2",
        "topic": "Backtracking Applications",
        "estimated_time_hours": 1.15,
        "prerequisites": ["1.1"],
        "subtopics": []
      },
      {
        "id": "1.3",
        "topic": "Backtracking Variations",
        "estimated_time_hours": 1.15,
        "prerequisites": ["1.2"],
        "subtopics": []
      }
    ]
  },
  {
    "id": "2",
    "topic": "Trees",
    "estimated_time_hours": 4.62,
    "prerequisites": [],
    "subtopics": [
      {
        "id": "2.1",
        "topic": "Tree Basics",
        "estimated_time_hours": 1.54,
        "prerequisites": [],
        "subtopics": []
      },
      {
        "id": "2.2",
        "topic": "Tree Traversal",
        "estimated_time_hours": 1.54,
        "prerequisites": ["2.1"],
        "subtopics": []
      },
      {
        "id": "2.3",
        "topic": "Tree Operations",
        "estimated_time_hours": 1.54,
        "prerequisites": ["2.2"],
        "subtopics": []
      }
    ]
  },
  {
    "id": "3",
    "topic": "Linked List",
    "estimated_time_hours": 2.31,
    "prerequisites": [],
    "subtopics": [
      {
        "id": "3.1",
        "topic": "Linked List Basics",
        "estimated_time_hours": 0.77,
        "prerequisites": [],
        "subtopics": []
      },
      {
        "id": "3.2",
        "topic": "Linked List Operations",
        "estimated_time_hours": 0.77,
        "prerequisites": ["3.1"],
        "subtopics": []
      },
      {
        "id": "3.3",
        "topic": "Advanced Linked List Topics",
        "estimated_time_hours": 0.77,
        "prerequisites": ["3.2"],
        "subtopics": []
      }
    ]
  }
];

// Test the flatten function
const flattenRoadmap = (items, acc = [], visited = new Set(), level = 0) => {
  const indent = '  '.repeat(level);
  console.log(`${indent}🔄 Flattening level ${level}, items:`, items?.length || 0);
  
  if (!Array.isArray(items)) {
    console.warn(`${indent}❌ Items is not an array:`, typeof items, items);
    return acc;
  }
  
  for (const item of items) {
    const id = item.id?.toString() || item.topic || `topic-${acc.length}`;
    console.log(`${indent}📝 Processing item: ${item.topic} (ID: ${id})`);
    
    if (!id || visited.has(id)) {
      console.log(`${indent}⚠️ Skipping duplicate or empty ID: ${id}`);
      continue;
    }
    visited.add(id);

    // Add current item to flattened array
    const flatItem = {
      id,
      label: item.topic || item.title || `Topic ${acc.length + 1}`,
      prerequisites: (item.prerequisites || []).map((p) => p.toString()),
      estimated_time_minutes: Math.round((item.estimated_time_hours || item.time_hours || 0) * 60) || item.estimated_time_minutes || 0,
      estimated_time_hours: item.estimated_time_hours || item.time_hours || 0,
    };
    
    acc.push(flatItem);
    console.log(`${indent}✅ Added to flatten: ${flatItem.label} (${flatItem.id})`);

    // Recursively process subtopics
    if (item.subtopics && Array.isArray(item.subtopics) && item.subtopics.length > 0) {
      console.log(`${indent}🔄 Found ${item.subtopics.length} subtopics for ${item.topic}, recursing...`);
      flattenRoadmap(item.subtopics, acc, visited, level + 1);
    } else {
      console.log(`${indent}📝 No subtopics for ${item.topic}`);
    }
  }
  
  if (level === 0) {
    console.log(`✅ Final flattened result: ${acc.length} total items`);
    acc.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.label} (${item.id}) - ${item.estimated_time_minutes}min`);
    });
  }
  
  return acc;
};

console.log('=== TESTING FLATTEN FUNCTION ===');
console.log('Input data:', testRoadmapData);
const result = flattenRoadmap(testRoadmapData);
console.log('Final result:', result);
console.log('Expected 12 items, got:', result.length);

export { testRoadmapData, flattenRoadmap };
