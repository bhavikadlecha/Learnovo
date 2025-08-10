import React, { useState } from 'react';
import axios from 'axios';
import RoadmapGraph from './RoadmapGraph';
import testStorageData from '../utils/testStorageData';
import { getStudyPlansFromStorage } from '../utils/studyPlanUtils';

const TestRoadmapPage = () => {
  const [roadmapData, setRoadmapData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [topics, setTopics] = useState('Backtracking,Trees,Linked List');

  const generateTestRoadmap = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/roadmap/generate_roadmap/', {
        params: { topics: topics }
      });
      
      console.log('🔥 Backend Response:', response.data);
      setRoadmapData(response.data.roadmap || []);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate roadmap');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Roadmap Generation</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          Topics (comma-separated):
          <input 
            type="text" 
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
          />
        </label>
        <button 
          onClick={generateTestRoadmap}
          disabled={isLoading}
          style={{ 
            marginLeft: '10px', 
            padding: '8px 16px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Generating...' : 'Generate Roadmap'}
        </button>
        
        <button 
          onClick={testStorageData}
          style={{ 
            marginLeft: '10px', 
            padding: '8px 16px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Storage Data
        </button>
        
        <button 
          onClick={() => {
            const data = getStudyPlansFromStorage();
            console.log('Current study plans from storage:', data);
            
            if (data.length > 0) {
              const firstPlan = data[0];
              console.log('First plan roadmaps:', firstPlan.roadmaps);
              
              // Test flattening manually
              const testFlatten = (items, acc = [], visited = new Set()) => {
                for (const item of items) {
                  const id = item.id?.toString() || item.topic || `topic-${acc.length}`;
                  if (!id || visited.has(id)) continue;
                  visited.add(id);

                  acc.push({
                    id,
                    label: item.topic || item.title || `Topic ${acc.length + 1}`,
                    prerequisites: (item.prerequisites || []).map((p) => p.toString()),
                    estimated_time_minutes: Math.round((item.estimated_time_hours || item.time_hours || 0) * 60) || item.estimated_time_minutes || 0,
                    estimated_time_hours: item.estimated_time_hours || item.time_hours || 0,
                  });

                  if (Array.isArray(item.subtopics) && item.subtopics.length > 0) {
                    console.log(`🔄 Processing ${item.subtopics.length} subtopics for: ${item.topic}`);
                    testFlatten(item.subtopics, acc, visited);
                  }
                }
                return acc;
              };
              
              const flattened = testFlatten(firstPlan.roadmaps);
              console.log('Manual flatten test result:', flattened);
              alert(`Found ${data.length} study plans. First plan has ${firstPlan.roadmaps?.length} roadmap items, flattened to ${flattened.length} nodes. Check console.`);
            } else {
              alert('No study plans found in storage.');
            }
          }}
          style={{ 
            marginLeft: '10px', 
            padding: '8px 16px', 
            backgroundColor: '#ffc107', 
            color: 'black', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Check Storage & Flatten
        </button>
      </div>

      {roadmapData && roadmapData.length > 0 && (
        <div>
          <h2>Generated Roadmap ({roadmapData.length} topics)</h2>
          <RoadmapGraph roadmapData={roadmapData} title="Test Roadmap" />
        </div>
      )}
      
      {roadmapData && roadmapData.length === 0 && (
        <div style={{ color: 'red' }}>
          No roadmap data received or empty roadmap
        </div>
      )}
    </div>
  );
};

export default TestRoadmapPage;
