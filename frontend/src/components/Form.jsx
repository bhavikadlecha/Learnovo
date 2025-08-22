import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { saveStudyPlanToStorage, initializeProgressForPlan } from '../utils/studyPlanUtils';

const Form = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    topic: '',
    studyHours: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      console.log("Submitting form data:", formData);
      
      const payload = {
        main_topic: formData.topic,
        available_time: parseInt(formData.studyHours, 10),
      };
      
      console.log("Sending payload:", payload);
      
      const response = await axios.post(
        'http://localhost:8000/api/roadmap/studyplan/create/',
        payload
      );

      console.log("Response received:", response.data);
      
      // Check if this was an API-generated roadmap or fallback
      const isApiGenerated = response.data.source === 'api' || 
                            response.data.api_success === true ||
                            (response.data.roadmap && !response.data.fallback_used);
      const isFallback = response.data.source === 'fallback' || 
                        response.data.fallback_used === true ||
                        response.data.api_success === false;
      
      // Log the source information
      console.log('Roadmap Source Detection:', {
        isApiGenerated,
        isFallback,
        source: response.data.source || 'unknown',
        api_success: response.data.api_success,
        fallback_used: response.data.fallback_used
      });
      
      const plan = response.data.plan;
      const roadmap = response.data.roadmap;

      // Save to localStorage in a format that matches what StudyPlan and Progress expect
      const newStudyPlan = {
        id: plan.id,
        main_topic: plan.main_topic,
        available_time: plan.available_time,
        created_at: plan.created_at || new Date().toISOString().split('T')[0],
        roadmaps: roadmap.roadmap || [],
        source: isApiGenerated ? 'API Generated' : 'Fallback Template',
        isApiGenerated,
        isFallback
      };
      
      console.log('About to save to localStorage:', newStudyPlan);
      
      // Use utility function to save and notify other components
      const saveSuccess = saveStudyPlanToStorage(newStudyPlan);
      console.log('Save success:', saveSuccess);

      // Initialize progress tracking for this roadmap
      initializeProgressForPlan(plan.id, roadmap.roadmap);

      console.log('Saved study plan to localStorage:', newStudyPlan);
      
      // Show success message with source information
      const sourceInfo = isApiGenerated ? '(AI Generated)' : '(Fallback Template)';
      setSuccess(`Study plan for "${newStudyPlan.main_topic}" created successfully! ${sourceInfo} Opening roadmap...`);

      // Dispatch event immediately after saving
      console.log('Dispatching studyPlansUpdated event immediately');
      window.dispatchEvent(new CustomEvent('studyPlansUpdated', { 
        detail: { 
          plans: [newStudyPlan],
          action: 'created',
          newPlan: newStudyPlan
        } 
      }));

      // Navigate directly to StudyPlan with auto-open parameter for the new roadmap
      setTimeout(() => {
        navigate(`/studyplan?openRoadmap=${plan.id}&autoOpen=true`);
      }, 1500);
      
      // Dispatch another event after navigation to ensure refresh
      setTimeout(() => {
        console.log('Dispatching post-navigation studyPlansUpdated event');
        window.dispatchEvent(new CustomEvent('studyPlansUpdated', { 
          detail: { 
            plans: [newStudyPlan],
            action: 'refresh',
            newPlan: newStudyPlan
          } 
        }));
      }, 2000);
    } catch (err) {
      console.error("Error submitting form:", err);
      if (err.response) {
        console.error("Error response data:", err.response.data);
        console.error("Error response status:", err.response.status);
        setError(`Error: ${err.response.status} - ${err.response.data.error || 'Something went wrong'}`);
      } else if (err.request) {
        console.error("Error request:", err.request);
        setError('Network error. Please check your connection and try again.');
      } else {
        console.error("Error message:", err.message);
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Study Plan</h1>
          <p className="text-gray-600">Generate a personalized learning roadmap</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">
              ✓ {success}
            </div>
          )}

          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
              What do you want to learn?
            </label>
            <input
              type="text"
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              required
              placeholder="e.g., Python Programming, Web Development, Machine Learning..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
            />
          </div>

          <div>
            <label htmlFor="studyHours" className="block text-sm font-medium text-gray-700 mb-2">
              How many hours can you dedicate to studying?
            </label>
            <input
              type="number"
              id="studyHours"
              name="studyHours"
              value={formData.studyHours}
              onChange={handleChange}
              required
              min="1"
              max="1000"
              placeholder="e.g., 20, 50, 100..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the total hours you can commit to this learning journey
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !formData.topic.trim() || !formData.studyHours}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Generating Your Study Plan...
              </div>
            ) : (
              'Generate Study Plan'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            We'll create a personalized learning roadmap based on your topic and available time
          </p>
        </div>
      </div>
    </div>
  );
};

export default Form;
