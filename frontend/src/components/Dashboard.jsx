import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getStudyPlansFromStorage, calculateProgressStats, getProgressForPlan } from '../utils/studyPlanUtils';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRoadmaps: 0,
    completedTasks: 0,
    totalTasks: 0,
    inProgressTasks: 0,
    completedRoadmaps: 0
  });

  useEffect(() => {
    fetchDashboardData();
    
    // Listen for study plan updates
    const handleStudyPlansUpdate = () => {
      fetchDashboardData();
    };
    
    // Listen for progress updates
    const handleProgressUpdate = () => {
      fetchDashboardData();
    };
    
    window.addEventListener('studyPlansUpdated', handleStudyPlansUpdate);
    window.addEventListener('progressUpdated', handleProgressUpdate);
    
    return () => {
      window.removeEventListener('studyPlansUpdated', handleStudyPlansUpdate);
      window.removeEventListener('progressUpdated', handleProgressUpdate);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardData = async () => {
    try {
      let roadmapsData = [];
      
      // First try backend API
      try {
        const response = await axios.get('http://localhost:8000/api/roadmap/user_study_plans/');
        roadmapsData = response.data || [];
      } catch (error) {
        console.warn('Backend API failed, using localStorage:', error);
        roadmapsData = [];
      }
      
      // Also get localStorage data and merge/prioritize it
      const localPlans = getStudyPlansFromStorage();
      if (localPlans && localPlans.length > 0) {
        const localData = localPlans.map((plan, index) => ({
          id: plan.id || `local_${index + 1}`,
          main_topic: plan.main_topic || plan.topic || 'Unknown Topic',
          available_time: plan.available_time || plan.studyHours || 0,
          created_at: plan.created_at || new Date().toISOString().split('T')[0],
          roadmaps: plan.roadmaps || []
        }));
        
        // Merge backend and localStorage data
        const mergedData = [...roadmapsData];
        localData.forEach(localPlan => {
          const existsInBackend = mergedData.find(backendPlan => backendPlan.id === localPlan.id);
          if (!existsInBackend) {
            mergedData.push(localPlan);
          }
        });
        roadmapsData = mergedData;
      }
      
      setRoadmaps(roadmapsData.slice(0, 6)); // Show only first 6 for dashboard
      
      // Calculate progress stats using nodeStatuses for real-time accuracy
      const nodeStatuses = JSON.parse(localStorage.getItem('nodeStatuses')) || {};
      let totalTasks = 0;
      let completedTasks = 0;
      let inProgressTasks = 0;
      let completedRoadmaps = 0;

      roadmapsData.forEach(roadmap => {
        try {
          // Get saved progress
          const savedProgress = getProgressForPlan(roadmap.id);
          
          // Merge with nodeStatuses for real-time updates
          let mergedProgress = { ...savedProgress };
          
          if (roadmap.roadmaps && roadmap.roadmaps.length > 0) {
            roadmap.roadmaps.forEach((item, index) => {
              const topicName = item.topic || item.title || `Topic ${index + 1}`;
              const nodeId = item.id?.toString() || topicName || `topic-${index}`;
              
              // Use nodeStatus if available
              if (nodeStatuses[nodeId]) {
                mergedProgress[topicName] = nodeStatuses[nodeId];
              } else if (!mergedProgress[topicName]) {
                mergedProgress[topicName] = 'Not Started';
              }
            });
            
            const stats = calculateProgressStats(mergedProgress);
            totalTasks += stats.total;
            completedTasks += stats.completed;
            inProgressTasks += stats.inProgress;
            
            // Check if roadmap is completed
            if (stats.total > 0 && stats.completed === stats.total) {
              completedRoadmaps++;
            }
          }
        } catch (error) {
          console.error('Error reading progress:', error);
        }
      });

      setStats({
        totalRoadmaps: roadmapsData.length,
        completedTasks,
        totalTasks,
        inProgressTasks,
        completedRoadmaps
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const quickActions = [
    {
      title: 'Create New Study Plan',
      description: 'Start your learning journey',
      icon: '+',
      color: 'bg-purple-500',
      action: () => navigate('/form')
    },
    {
      title: 'View All Study Plans',
      description: 'See your complete collection',
      icon: 'SP',
      color: 'bg-blue-500',
      action: () => navigate('/studyplan')
    },
    {
      title: 'Track Progress',
      description: 'Monitor your learning',
      icon: 'P',
      color: 'bg-green-500',
      action: () => navigate('/progress')
    },
    {
      title: 'Profile Settings',
      description: 'Manage your account',
      icon: 'S',
      color: 'bg-gray-500',
      action: () => navigate('/profile')
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {getGreeting()}, {user?.first_name || user?.username || 'Learner'}!
          </h1>
          <p className="text-gray-600 text-lg">
            Ready to continue your learning journey today?
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.totalRoadmaps}</div>
            <div className="text-gray-600 mt-1">Study Plans</div>
            <div className="text-sm text-gray-400 mt-1">
              {stats.completedRoadmaps} completed
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.completedTasks}</div>
            <div className="text-gray-600 mt-1">Tasks Completed</div>
            <div className="text-sm text-gray-400 mt-1">
              of {stats.totalTasks} total
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600">{stats.inProgressTasks}</div>
            <div className="text-gray-600 mt-1">In Progress</div>
            <div className="text-sm text-gray-400 mt-1">
              {stats.totalTasks - stats.completedTasks - stats.inProgressTasks} not started
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
            </div>
            <div className="text-gray-600 mt-1">Overall Progress</div>
            <div className="text-sm text-gray-400 mt-1">
              Learning efficiency
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <div
                key={index}
                onClick={action.action}
                className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
              >
                <div className={`${action.color} w-12 h-12 rounded-full flex items-center justify-center text-white text-xl mb-4`}>
                  {action.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{action.title}</h3>
                <p className="text-gray-600 text-sm">{action.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Study Plans */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Your Customized Study Plans</h2>
            <button
              onClick={() => navigate('/studyplan')}
              className="text-purple-600 hover:text-purple-800 font-medium"
            >
              View All →
            </button>
          </div>
          
          {roadmaps.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="text-6xl mb-4 text-gray-400">�</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Study Plans Yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first personalized study plan to get started!
              </p>
              <button
                onClick={() => navigate('/form')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-all"
              >
                Create Your First Plan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roadmaps.map((roadmap) => {
                // Calculate progress for this roadmap
                let progress = { completed: 0, total: 0, percentage: 0 };
                try {
                  const savedProgress = localStorage.getItem(`roadmap_progress_${roadmap.id}`);
                  if (savedProgress) {
                    const parsedProgress = JSON.parse(savedProgress);
                    const totalTasks = Object.keys(parsedProgress).length;
                    const completedTasks = Object.values(parsedProgress).filter(status => status === 'completed').length;
                    progress = {
                      completed: completedTasks,
                      total: totalTasks,
                      percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
                    };
                  }
                } catch (error) {
                  console.error('Error reading progress:', error);
                }

                return (
                  <div
                    key={roadmap.id}
                    onClick={() => navigate(`/roadmap/${roadmap.id}`)}
                    className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4">
                      <h3 className="text-lg font-bold text-white truncate">
                        {roadmap.main_topic || roadmap.title}
                      </h3>
                      <p className="text-purple-100 text-sm">
                        {roadmap.available_time || 'Custom timing'}
                      </p>
                    </div>

                    {/* Card Content */}
                    <div className="p-4">
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">Progress</span>
                          <span className="text-sm font-bold text-purple-600">
                            {progress.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress.percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex justify-between items-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          progress.percentage === 100
                            ? 'bg-green-100 text-green-800'
                            : progress.percentage > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {progress.percentage === 100
                            ? '✓ Complete'
                            : progress.percentage > 0
                            ? 'In Progress'
                            : 'New'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {progress.completed}/{progress.total} tasks
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's Focus */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Today's Focus</h2>
          <div className="space-y-4">
            {roadmaps.length > 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2 text-gray-400">⭐</div>
                <p className="text-gray-600">
                  Continue working on your study plans and make progress every day!
                </p>
                <button
                  onClick={() => navigate('/progress')}
                  className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg transition-all"
                >
                  Track Your Progress
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2 text-gray-400">→</div>
                <p className="text-gray-600 mb-4">
                  Ready to start your learning journey? Create your first study plan!
                </p>
                <button
                  onClick={() => navigate('/form')}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg transition-all"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

