import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { getStudyPlansFromStorage, updateTopicProgress, getProgressForPlan, calculateProgressStats, deleteStudyPlanFromStorage } from '../utils/studyPlanUtils';

const Progress = () => {
  const { user } = useAuth();
  const [studyPlans, setStudyPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    fetchStudyPlans();
    
    // Listen for study plan updates
    const handleStudyPlansUpdate = () => {
      console.log('Progress component: Received update event');
      fetchStudyPlans();
    };
    
    // Listen for progress updates
    const handleProgressUpdate = () => {
      console.log('Progress component: Received progress update event');
      fetchStudyPlans();
    };
    
    // Handle click outside to close menu
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.dropdown-menu')) {
        setOpenMenuId(null);
      }
    };
    
    window.addEventListener('studyPlansUpdated', handleStudyPlansUpdate);
    window.addEventListener('progressUpdated', handleProgressUpdate);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('studyPlansUpdated', handleStudyPlansUpdate);
      window.removeEventListener('progressUpdated', handleProgressUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user, openMenuId]);

  const fetchStudyPlans = async () => {
    setLoading(true);
    try {
      // First try to get from backend API (same as StudyPlan component)
      const response = await axios.get('http://localhost:8000/api/roadmap/user_study_plans/');
      console.log('Backend study plans:', response.data);
      let plans = response.data;
      
      // If no data from backend, try localStorage
      if (!plans || plans.length === 0) {
        console.log('No backend data, trying localStorage...');
        plans = getLocalStorageStudyPlans();
      }
      
      setStudyPlans(plans);
    } catch (error) {
      console.log('Backend failed, getting from localStorage:', error);
      // Fallback to localStorage
      const localPlans = getLocalStorageStudyPlans();
      setStudyPlans(localPlans);
    } finally {
      setLoading(false);
    }
  };

  const getLocalStorageStudyPlans = () => {
    const plans = getStudyPlansFromStorage();
    console.log('Local storage plans:', plans);
    
    // Transform localStorage data to match expected format if needed
    return plans.map((plan, index) => ({
      id: plan.id || index + 1,
      main_topic: plan.main_topic || plan.topic || 'Unknown Topic',
      available_time: plan.available_time || plan.studyHours || 0,
      created_at: plan.created_at || new Date().toISOString().split('T')[0],
      roadmaps: plan.roadmaps || []
    }));
  };

  // Function to delete a study plan
  const handleDeletePlan = async (planId) => {
    if (window.confirm('Are you sure you want to delete this study plan? This action cannot be undone.')) {
      try {
        setUpdating(true);
        
        // Try to delete from backend first
        try {
          await axios.delete(`http://localhost:8000/api/roadmap/delete_plan/${planId}/`);
          console.log('Deleted from backend successfully');
        } catch (error) {
          console.warn('Backend deletion failed, continuing with local deletion:', error);
        }
        
        // Delete from localStorage
        const success = deleteStudyPlanFromStorage(planId);
        
        if (success) {
          console.log(`Deleted study plan ${planId}`);
          // The event listener will automatically refresh the data
        } else {
          console.error('Failed to delete study plan');
        }
      } catch (error) {
        console.error('Error deleting study plan:', error);
      } finally {
        setUpdating(false);
        setOpenMenuId(null);
      }
    }
  };
  
  const calculateProgress = (plan) => {
    // Get progress data from localStorage for this specific plan using utility
    const progress = getProgressForPlan(plan.id);
    
    // If no saved progress but we have roadmaps, initialize progress
    if (Object.keys(progress).length === 0 && plan.roadmaps && Array.isArray(plan.roadmaps)) {
      const initialProgress = {};
      plan.roadmaps.forEach((item, index) => {
        const topicName = item.topic || item.title || `Topic ${index + 1}`;
        initialProgress[topicName] = 'not-started';
      });
      // Save the initialized progress
      localStorage.setItem(`roadmap_progress_${plan.id}`, JSON.stringify(initialProgress));
      
      // Return calculated stats for initial progress
      const stats = calculateProgressStats(initialProgress);
      return {
        ...stats,
        progress: initialProgress
      };
    }
    
    if (Object.keys(progress).length === 0) {
      return { completed: 0, inProgress: 0, notStarted: 0, percentage: 0, total: 0, progress: {} };
    }
    
    // Use utility function to calculate stats
    const stats = calculateProgressStats(progress);
    return {
      ...stats,
      progress
    };
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };
  
  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return '✅';
      case 'in-progress': return '⏳';
      default: return '⭕';
    }
  };

  /*const getTopicIcon = (topic) => {
    const topicLower = topic.toLowerCase();
    if (topicLower.includes('python')) return '🐍';
    if (topicLower.includes('javascript') || topicLower.includes('js')) return '📜';
    if (topicLower.includes('web')) return '🌐';
    if (topicLower.includes('machine learning') || topicLower.includes('ml')) return '🤖';
    if (topicLower.includes('data')) return '📊';
    if (topicLower.includes('react')) return '⚛️';
    if (topicLower.includes('node')) return '💚';
    if (topicLower.includes('database') || topicLower.includes('sql')) return '🗄️';
    return '📚';
  };
*/
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your study plans...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Learning Progress</h1>
          <p className="text-gray-600">Track your progress across all study plans</p>
        </div>
        
        {studyPlans.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Study Plans Yet</h2>
            <p className="text-gray-600 mb-6">Create your first study plan to start tracking your learning progress</p>
            <button 
              onClick={() => window.location.href = '/form'}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Create Study Plan
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {studyPlans.map((plan) => {
                const stats = calculateProgress(plan);
                return (
                  <div key={plan.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {/* <span className="text-3xl">{getTopicIcon(plan.main_topic)}</span> */}
                          <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded-full">
                            {plan.available_time}h total
                          </span>
                        </div>
                        {/* 3-dot menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === plan.id ? null : plan.id);
                            }}
                            className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                            title="Options"
                          >
                            <span className="text-white text-lg">⋮</span>
                          </button>
                          
                          {openMenuId === plan.id && (
                            <div className="dropdown-menu absolute right-0 top-8 bg-white rounded-lg shadow-lg border z-10 min-w-[120px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePlan(plan.id);
                                }}
                                disabled={updating}
                                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-1">{plan.main_topic}</h3>
                      <p className="text-blue-100 text-sm">Started {formatDate(plan.created_at)}</p>
                    </div>
                    
                    <div className="p-6">
                      {/* Overall Progress */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                          <span className="text-2xl font-bold text-gray-800">{stats.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${stats.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Progress Stats Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
                          <div className="text-xs text-green-600 font-medium">Completed</div>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-yellow-700">{stats.inProgress}</div>
                          <div className="text-xs text-yellow-600 font-medium">In Progress</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-gray-700">{stats.notStarted}</div>
                          <div className="text-xs text-gray-600 font-medium">Not Started</div>
                        </div>
                      </div>
                      
                      {/* Topic Details Button */}
                      <button 
                        onClick={() => setSelectedPlan(selectedPlan === plan.id ? null : plan.id)}
                        className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-all font-medium flex justify-between items-center"
                      >
                        <span>View Incomplete Topics ({Object.entries(stats.progress || {}).filter(([topic, status]) => status !== 'completed').length})</span>
                        <span className="transform transition-transform duration-200" style={{transform: selectedPlan === plan.id ? 'rotate(180deg)' : 'rotate(0deg)'}}>
                          ▼
                        </span>
                      </button>
                      
                      {/* Topic List - Only show incomplete topics */}
                      {selectedPlan === plan.id && (
                        <div className="mt-4 border-t border-gray-200 pt-4 max-h-80 overflow-y-auto">
                          <ul className="space-y-3">
                            {Object.entries(stats.progress || {})
                              .filter(([topic, status]) => status !== 'completed') // Only show incomplete topics
                              .map(([topic, status]) => (
                              <li key={topic} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <span className={`flex-none w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getStatusColor(status)}`}>
                                  {getStatusIcon(status)}
                                </span>
                                <div className="flex-1">
                                  <span className="text-gray-800 font-medium">{topic}</span>
                                  <div className="text-xs text-gray-500 capitalize">{status.replace('-', ' ')}</div>
                                </div>
                                
                              </li>
                            ))}
                            {Object.entries(stats.progress || {}).filter(([topic, status]) => status !== 'completed').length === 0 && (
                              <li className="text-center py-6 text-gray-500">
                                🎉 All topics completed! Great job!
                              </li>
                            )}
                          </ul>
                          {updating && (
                            <div className="text-center py-2 text-sm text-gray-500">
                              Updating progress...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Summary Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{studyPlans.length}</div>
                  <div className="text-sm text-blue-600 font-medium">Active Plans</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {studyPlans.reduce((acc, plan) => acc + calculateProgress(plan).completed, 0)}
                  </div>
                  <div className="text-sm text-green-600 font-medium">Topics Completed</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">
                    {studyPlans.reduce((acc, plan) => acc + calculateProgress(plan).inProgress, 0)}
                  </div>
                  <div className="text-sm text-yellow-600 font-medium">Topics In Progress</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    {studyPlans.reduce((acc, plan) => acc + plan.available_time, 0)}h
                  </div>
                  <div className="text-sm text-purple-600 font-medium">Total Study Hours</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Progress;