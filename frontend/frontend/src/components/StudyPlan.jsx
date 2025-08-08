import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StudyPlanCard from './StudyPlanCard';

const StudyPlan = () => {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get('http://localhost:8000/roadmap/user_study_plans/');
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to fetch study plans:', error);
    }
  };

  const deletePlan = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/roadmap/delete_plan/${id}/`);
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Failed to delete plan:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <h1 className="text-3xl font-bold text-blue-400 mb-6 text-center">
        Your Study Plans
      </h1>

      {plans.length === 0 ? (
        <p className="text-center text-gray-400">No study plans available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
          {plans.map((plan) => (
            <StudyPlanCard key={plan.id} plan={plan} onDelete={deletePlan} />
          ))}
        </div>
      )}
    </div>
  );
};

export default StudyPlan;
