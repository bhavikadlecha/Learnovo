import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    studySessionDuration: '25',
    learningStyle: 'visual',
    progressVisibility: true,
    studyPlanVisibility: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load settings from localStorage or API
    loadUserSettings();
  }, []);

  const loadUserSettings = () => {
    try {
      const savedSettings = localStorage.getItem(`userSettings_${user?.id || 'default'}`);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    setLoading(true);
    try {
      // Save to localStorage (can be extended to API)
      localStorage.setItem(`userSettings_${user?.id || 'default'}`, JSON.stringify(settings));
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error saving settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    const defaultSettings = {
      emailNotifications: true,
      pushNotifications: true,
      studySessionDuration: '25',
      learningStyle: 'visual',
      progressVisibility: true,
      studyPlanVisibility: false,
    };
    setSettings(defaultSettings);
    setMessage('Settings reset to default values.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
              <p className="text-gray-600">Customize your learning experience</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.includes('successfully') || message.includes('reset')
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}
          
          <div className="space-y-6">
            {/* Account Settings */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Notification Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Notifications
                  </label>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Receive learning progress updates
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Push Notifications
                  </label>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    checked={settings.pushNotifications}
                    onChange={(e) => handleInputChange('pushNotifications', e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Study reminders and achievements
                  </span>
                </div>
              </div>
            </div>

            {/* Learning Preferences */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Learning Preferences</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Study Session Duration
                  </label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={settings.studySessionDuration}
                    onChange={(e) => handleInputChange('studySessionDuration', e.target.value)}
                  >
                    <option value="25">25 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Learning Style
                  </label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={settings.learningStyle}
                    onChange={(e) => handleInputChange('learningStyle', e.target.value)}
                  >
                    <option value="visual">Visual</option>
                    <option value="auditory">Auditory</option>
                    <option value="kinesthetic">Kinesthetic</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Privacy Settings</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    checked={settings.progressVisibility}
                    onChange={(e) => handleInputChange('progressVisibility', e.target.checked)}
                  />
                  <span className="ml-3 text-sm text-gray-600">
                    Make my learning progress visible to others
                  </span>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    checked={settings.studyPlanVisibility}
                    onChange={(e) => handleInputChange('studyPlanVisibility', e.target.checked)}
                  />
                  <span className="ml-3 text-sm text-gray-600">
                    Allow others to see my study plans
                  </span>
                </div>
              </div>
            </div>

            {/* Account Management */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Management</h2>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Data & Privacy</h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => navigate('/profile')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Profile Settings →
                    </button>
                    <br />
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Download My Data
                    </button>
                    <br />
                    <button className="text-red-600 hover:text-red-800 text-sm">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <div className="space-x-4">
              <button 
                onClick={handleResetSettings}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset to Default
              </button>
            </div>
            <div className="space-x-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSettings}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
