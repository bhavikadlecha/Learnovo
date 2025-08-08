import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import RoadmapGraph from './RoadmapGraph';

const RoadmapPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [roadmap, setRoadmap] = useState(null);

  useEffect(() => {
    const passedPlan = location.state?.roadmapPlan;

    if (passedPlan) {
      console.log("✅ Loaded plan from navigation state:", passedPlan);
      setRoadmap(passedPlan);
    } else {
      const fetchPlan = async () => {
        try {
          const res = await fetch(`http://localhost:8000/roadmap/get_plan/${id}/`);

          if (!res.ok) throw new Error('Not found');
          const data = await res.json();
          console.log('✅ Loaded full plan from API:', data.fetchPlan);
          setRoadmap(data.fetchPlan);
        } catch (err) {
          console.warn('❌ Study plan not found:', err);
          navigate('/StudyPlan');
        }
      };
      fetchPlan();
    }
  }, [id, navigate, location.state]);

  return (
    <div className="p-4 text-white min-h-screen bg-gray-900">
      {roadmap && roadmap.roadmaps?.length > 0 ? (
        <RoadmapGraph roadmap={roadmap} />
      ) : (
        <p className="text-center mt-10">Loading or roadmap not found…</p>
      )}
    </div>
  );
};

export default RoadmapPage;
