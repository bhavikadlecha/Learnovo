import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SimpleRoadmapTest = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log('SimpleRoadmapTest: Starting API call...');
      
      try {
        const response = await axios.get('http://localhost:8000/api/roadmap/user_study_plans/');
        console.log('SimpleRoadmapTest: API Response:', response);
        console.log('SimpleRoadmapTest: Response status:', response.status);
        console.log('SimpleRoadmapTest: Response data:', response.data);
        console.log('SimpleRoadmapTest: Data type:', typeof response.data);
        console.log('SimpleRoadmapTest: Is array:', Array.isArray(response.data));
        console.log('SimpleRoadmapTest: Data length:', response.data?.length);
        
        setRoadmaps(response.data || []);
        console.log('SimpleRoadmapTest: Set roadmaps state');
        
      } catch (err) {
        console.error('SimpleRoadmapTest: API Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        console.log('SimpleRoadmapTest: Set loading to false');
      }
    };

    fetchData();
  }, []);

  console.log('SimpleRoadmapTest: Render - roadmaps:', roadmaps);
  console.log('SimpleRoadmapTest: Render - roadmaps.length:', roadmaps.length);
  console.log('SimpleRoadmapTest: Render - loading:', loading);
  console.log('SimpleRoadmapTest: Render - error:', error);

  if (loading) {
    return <div style={{padding: '20px'}}>Loading...</div>;
  }

  if (error) {
    return <div style={{padding: '20px', color: 'red'}}>Error: {error}</div>;
  }

  return (
    <div style={{padding: '20px'}}>
      <h2>Simple Roadmap Test</h2>
      <p>Found {roadmaps.length} study plans</p>
      
      {roadmaps.length === 0 ? (
        <div>No study plans found</div>
      ) : (
        <div>
          <h3>Study Plans:</h3>
          {roadmaps.map((plan, index) => (
            <div key={plan.id || index} style={{border: '1px solid #ccc', margin: '10px', padding: '10px'}}>
              <h4>{plan.main_topic || 'Unknown Topic'}</h4>
              <p>Available time: {plan.available_time} hours</p>
              <p>Created: {plan.created_at}</p>
              <p>Roadmap items: {plan.roadmaps?.length || 0}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleRoadmapTest;
