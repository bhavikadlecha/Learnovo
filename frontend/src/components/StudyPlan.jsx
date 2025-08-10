import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { getStudyPlansFromStorage, getProgressForPlan, calculateProgressStats, deleteStudyPlanFromStorage } from '../utils/studyPlanUtils';
import RoadmapGraph from './RoadmapGraph';

const StudyPlan = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [showRoadmapDetail, setShowRoadmapDetail] = useState(false);

  useEffect(() => {
    // Initial load
    fetchRoadmaps();
    
    // Listen for study plan updates
    const handleStudyPlansUpdate = (event) => {
      console.log('StudyPlans component: Received update event', event.detail);
      // Force immediate refresh
      setTimeout(() => {
        fetchRoadmaps(true);
      }, 100);
    };
    
    // Listen for progress updates
    const handleProgressUpdate = (event) => {
      console.log('StudyPlans component: Received progress update event', event.detail);
      fetchRoadmaps(true);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Add a separate useEffect to refresh when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Document became visible, refreshing study plans');
        fetchRoadmaps(true);
      }
    };

    const handleFocus = () => {
      console.log('Window focused, refreshing study plans');
      fetchRoadmaps(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Add another useEffect to refresh on route changes
  useEffect(() => {
    // This will run every time the component mounts/remounts
    console.log('StudyPlan component mounted/updated, refreshing data');
    fetchRoadmaps(true);
  }, [location?.pathname]); // Refresh when route changes

  const fetchRoadmaps = async (forceRefresh = false) => {
    setLoading(true);
    try {
      let roadmapsData = [];
      
      // First try backend API (like Progress component does)
      try {
        const response = await axios.get('http://localhost:8000/api/roadmap/user_study_plans/');
        console.log('Backend study plans:', response.data);
        roadmapsData = response.data || [];
        console.log('Using backend data:', roadmapsData);
      } catch (error) {
        console.warn('Backend API failed:', error);
        roadmapsData = [];
      }
      
      // Also get localStorage data and merge/prioritize it
      const localPlans = getStudyPlansFromStorage();
      console.log('Local storage plans:', localPlans);
      
      if (localPlans && localPlans.length > 0) {
        // Transform localStorage data to match expected format
        const localData = localPlans.map((plan, index) => ({
          id: plan.id || `local_${index + 1}`,
          main_topic: plan.main_topic || plan.topic || 'Unknown Topic',
          available_time: plan.available_time || plan.studyHours || 0,
          created_at: plan.created_at || new Date().toISOString().split('T')[0],
          roadmaps: plan.roadmaps || []
        }));
        
        // Merge backend and localStorage data, prioritizing localStorage for newer items
        const mergedData = [...roadmapsData];
        
        localData.forEach(localPlan => {
          const existsInBackend = mergedData.find(backendPlan => backendPlan.id === localPlan.id);
          if (!existsInBackend) {
            // Add localStorage plans that aren't in backend yet
            mergedData.push(localPlan);
            console.log('Added localStorage plan to merged data:', localPlan);
          }
        });
        
        roadmapsData = mergedData;
        console.log('Using merged data (backend + localStorage):', roadmapsData);
      }
      
      // If still no data, use localStorage as fallback
      if (roadmapsData.length === 0 && localPlans && localPlans.length > 0) {
        roadmapsData = localPlans.map((plan, index) => ({
          id: plan.id || `local_${index + 1}`,
          main_topic: plan.main_topic || plan.topic || 'Unknown Topic',
          available_time: plan.available_time || plan.studyHours || 0,
          created_at: plan.created_at || new Date().toISOString().split('T')[0],
          roadmaps: plan.roadmaps || []
        }));
        console.log('Using localStorage fallback data:', roadmapsData);
      }
      
      console.log('Final roadmaps data:', roadmapsData);
      setRoadmaps(roadmapsData);
      
      // Calculate progress for each roadmap using both saved progress and nodeStatuses
      const progress = {};
      roadmapsData.forEach(roadmap => {
        try {
          // Get saved progress from localStorage
          const savedProgress = getProgressForPlan(roadmap.id);
          
          // Get nodeStatuses for real-time updates
          const nodeStatuses = JSON.parse(localStorage.getItem('nodeStatuses')) || {};
          
          // Merge progress data, prioritizing nodeStatuses for accuracy
          let mergedProgress = { ...savedProgress };
          
          if (roadmap.roadmaps && roadmap.roadmaps.length > 0) {
            roadmap.roadmaps.forEach((item, index) => {
              const topicName = item.topic || item.title || `Topic ${index + 1}`;
              const nodeId = item.id?.toString() || topicName || `topic-${index}`;
              
              // Use nodeStatus if available, otherwise use saved progress
              if (nodeStatuses[nodeId]) {
                mergedProgress[topicName] = nodeStatuses[nodeId];
              } else if (!mergedProgress[topicName]) {
                mergedProgress[topicName] = 'Not Started';
              }
            });
          }
          
          if (Object.keys(mergedProgress).length > 0) {
            const stats = calculateProgressStats(mergedProgress);
            progress[roadmap.id] = {
              ...stats,
              progress: mergedProgress
            };
          } else {
            progress[roadmap.id] = { completed: 0, inProgress: 0, total: 0, percentage: 0, progress: {} };
          }
        } catch (error) {
          console.error('Error reading progress:', error);
          progress[roadmap.id] = { completed: 0, inProgress: 0, total: 0, percentage: 0, progress: {} };
        }
      });
      setProgressData(progress);
    } catch (error) {
      console.error('Error fetching roadmaps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewRoadmap = () => {
    navigate('/form');
  };

  const handleViewRoadmap = (roadmap) => {
    console.log('Viewing roadmap:', roadmap);
    setSelectedRoadmap(roadmap);
    setShowRoadmapDetail(true);
  };

  const handleDeletePlan = async (planId, event) => {
    // Prevent card click when clicking delete
    event.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this study plan? This action cannot be undone.')) {
      try {
        setLoading(true);
        
        // Try to delete from backend first
        try {
          await axios.delete(`http://localhost:8000/api/roadmap/delete_plan/${planId}/`);
          console.log('Deleted from backend successfully');
        } catch (error) {
          console.warn('Backend deletion failed, continuing with local deletion:', error);
        }
        
        // Delete from localStorage using utility function
        const success = deleteStudyPlanFromStorage(planId);
        
        if (success) {
          console.log(`Deleted study plan ${planId}`);
          // Refresh data to show updated list
          await fetchRoadmaps();
        } else {
          console.error('Failed to delete study plan');
        }
      } catch (error) {
        console.error('Error deleting study plan:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your study plans...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            📚 My Study Plans
          </h1>
          <p className="text-gray-600 mb-6">
            Track your learning journey and create new study roadmaps
          </p>
          
          {/* Create New Roadmap Button */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleCreateNewRoadmap}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              ➕ Create New Study Plan
            </button>
            
            <button
              onClick={() => {
                console.log('Manual refresh triggered');
                fetchRoadmaps();
              }}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Study Plans Grid */}
        {roadmaps.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">📖</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Study Plans Yet</h3>
              <p className="text-gray-600 mb-4">
                Start your learning journey by creating your first study plan!
              </p>
              <button
                onClick={handleCreateNewRoadmap}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map((roadmap) => {
              const progress = progressData[roadmap.id] || { completed: 0, total: 0, percentage: 0 };
              
              return (
                <div
                  key={roadmap.id}
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer overflow-hidden"
                  onClick={() => handleViewRoadmap(roadmap.id)}
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white truncate">
                          {roadmap.main_topic || roadmap.title}
                        </h3>
                        <p className="text-purple-100 text-sm">
                          Created {formatDate(roadmap.created_at)}
                        </p>
                      </div>
                      {/* 3-dot menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === roadmap.id ? null : roadmap.id);
                          }}
                          className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                          title="Options"
                        >
                          <span className="text-white text-lg">⋮</span>
                        </button>
                        
                        {openMenuId === roadmap.id && (
                          <div className="dropdown-menu absolute right-0 top-8 bg-white rounded-lg shadow-lg border z-10 min-w-[120px]">
                            <button
                              onClick={(e) => handleDeletePlan(roadmap.id, e)}
                              className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                
                  {/* Card Content */}
                  <div className="p-6">
                    {/* Available Time */}
                    <div className="mb-4">
                      <div className="flex items-center text-gray-600 text-sm">
                        <span className="mr-2">⏰</span>
                        <span>
                          {roadmap.available_time || 'No time specified'} 
                          {roadmap.available_time && String(roadmap.available_time).includes('hour') ? '' : ' hours/week'}
                        </span>
                      </div>
                    </div>

                    

                    

                    {/* View Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewRoadmap(roadmap);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                      >
                        View Roadmap
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Stats */}
        {roadmaps.length > 0 && (
          <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Quick Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{roadmaps.length}</div>
                <div className="text-gray-600">Total Study Plans</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {roadmaps.reduce((total, roadmap) => total + (roadmap.roadmaps?.length || 0), 0)}
                </div>
                <div className="text-gray-600">Total Topics</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {roadmaps.reduce((total, roadmap) => total + (roadmap.available_time || 0), 0)}
                </div>
                <div className="text-gray-600">Total Hours/Week</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Roadmap Detail Modal */}
      <RoadmapDetailModal 
        roadmap={selectedRoadmap}
        isOpen={showRoadmapDetail}
        onClose={() => {
          setShowRoadmapDetail(false);
          setSelectedRoadmap(null);
        }}
      />
    </div>
  );
};

// RoadmapDetailModal Component
const RoadmapDetailModal = ({ roadmap, isOpen, onClose }) => {
  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup function to restore scroll on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !roadmap) return null;

  const roadmapData = roadmap.roadmaps || [];

  return (
    <div className="fixed inset-0 bg-white z-[9999]" style={{ zIndex: 9999 }}>
      <div className="h-full flex flex-col">
        {/* Header with Back Arrow */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 flex items-center justify-between shadow-lg relative z-[10000]" style={{ zIndex: 10000 }}>
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all duration-200 group"
              title="Go back"
            >
              <svg 
                className="w-5 h-5 transform transition-transform group-hover:scale-110" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-xl">🗺️</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Study Plan Roadmap</h2>
                <p className="text-purple-100 text-sm">{roadmap.main_topic} - Interactive Visualization</p>
              </div>
            </div>
          </div>
          <div className="text-sm text-purple-100">
            Click nodes to update progress
          </div>
        </div>

        {/* ReactFlow Roadmap Content - Full Screen */}
        <div className="flex-1 overflow-hidden">
          {roadmapData && roadmapData.length > 0 ? (
            <RoadmapGraph 
              roadmapData={roadmapData} 
              title={roadmap.main_topic}
              studyPlanId={roadmap.id}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Roadmap Data Available</h3>
                <p className="text-gray-500">This study plan doesn't have detailed roadmap information yet.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyPlan;
