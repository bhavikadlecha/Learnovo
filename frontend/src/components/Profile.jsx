import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Profile = () => {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({
    totalRoadmaps: 0,
    completedTasks: 0,
    totalTasks: 0,
    learningStreak: 0
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
      });
      fetchUserStats();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUserStats = async () => {
    try {
      // Get roadmaps from API
      const response = await axios.get('http://localhost:8000/api/roadmaps/', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      const roadmaps = response.data;
      let totalTasks = 0;
      let completedTasks = 0;

      // Calculate stats from localStorage progress
      roadmaps.forEach(roadmap => {
        try {
          const savedProgress = localStorage.getItem(`roadmap_progress_${roadmap.id}`);
          if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            const total = Object.keys(progress).length;
            const completed = Object.values(progress).filter(status => status === 'completed').length;
            totalTasks += total;
            completedTasks += completed;
          }
        } catch (error) {
          console.error('Error reading progress:', error);
        }
      });

      setStats({
        totalRoadmaps: roadmaps.length,
        completedTasks,
        totalTasks,
        learningStreak: Math.floor(Math.random() * 30) + 1 // Mock streak data
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      await axios.put(
        'http://localhost:8000/api/users/profile/update/',
        profileData,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Update user context with new data
      // You might want to update the auth context here
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original user data
    setProfileData({
      username: user.username || '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
    });
    setIsEditing(false);
    setMessage('');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Please log in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            👤 My Profile
          </h1>
          <p className="text-gray-600">
            Manage your account settings and view your learning statistics
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all"
                  >
                    ✏️ Edit Profile
                  </button>
                ) : (
                  <div className="space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                    >
                      {loading ? '💾 Saving...' : '💾 Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                )}
              </div>

              {message && (
                <div className={`mb-4 p-3 rounded-lg ${
                  message.includes('successfully') 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={profileData.first_name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={profileData.last_name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={profileData.username}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="space-y-6">
            {/* Learning Stats */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Learning Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Study Plans</span>
                  <span className="font-bold text-blue-600">{stats.totalRoadmaps}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completed Tasks</span>
                  <span className="font-bold text-green-600">{stats.completedTasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Tasks</span>
                  <span className="font-bold text-purple-600">{stats.totalTasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Learning Streak</span>
                  <span className="font-bold text-orange-600">{stats.learningStreak} days</span>
                </div>
              </div>
            </div>

            {/* Progress Overview */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 Progress</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                    <span>Overall Completion</span>
                    <span>{stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">⚡ Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={logout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-all"
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
