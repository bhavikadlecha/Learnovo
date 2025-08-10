import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Form = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    main_topic: '',
    available_time: '',
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    console.log('Form submitted with data:', formData); // Debug log

    try {
      const response = await axios.post(
        'http://localhost:8000/api/roadmap/studyplan/create/',
        {
          main_topic: formData.main_topic,
          available_time: formData.available_time,
        }
      );

      const plan = response.data.plan;
      const roadmap = response.data.roadmap;

      console.log('📊 Form.js received data:', {
        plan: plan,
        roadmap: roadmap,
        roadmapArray: roadmap.roadmap || roadmap,
        roadmapData: response.data.roadmap_data
      });

      // ✅ Save to localStorage with complete nested structure
      const existing = JSON.parse(localStorage.getItem('studyPlans')) || [];
      
      // Store the nested roadmap data with multiple fallback keys for compatibility
      const studyPlanData = { 
        ...plan, 
        roadmaps: roadmap.roadmap || roadmap,  // Main nested structure
        roadmap_data: response.data.roadmap_data || { roadmap: roadmap.roadmap || roadmap },  // Alternative structure
        roadmap: roadmap.roadmap || roadmap  // Fallback
      };
      
      console.log('📊 Storing to localStorage:', studyPlanData);
      
      localStorage.setItem('studyPlans', JSON.stringify([
        ...existing,
        studyPlanData
      ]));

      // ✅ Navigate to RoadmapPage with the plan ID
      navigate(`/roadmap/${plan.id}`);
    } catch (err) {
      console.error('Form submission error:', err);
      setError('Something went wrong. Please check your input.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Create Study Plan</h2>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <label className="block mb-2 text-sm font-medium">Topic you want to study</label>
        <input
          type="text"
          name="main_topic"
          value={formData.main_topic}
          onChange={handleChange}
          required
          placeholder="e.g. Web Development"
          className="w-full p-3 mb-4 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="block mb-2 text-sm font-medium">Available Time (in hours)</label>
        <input
          type="number"
          name="available_time"
          value={formData.available_time}
          onChange={handleChange}
          required
          placeholder="e.g. 12"
          className="w-full p-3 mb-6 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded text-white text-lg font-semibold transition duration-200"
        >
          Generate Study Plan
        </button>
      </form>
    </div>
  );
};

export default Form;
