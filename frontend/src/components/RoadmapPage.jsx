import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const RoadmapPage = () => {
  const [roadmapCards, setRoadmapCards] = useState([]);
  const [userRoadmaps, setUserRoadmaps] = useState([]);
  const [filteredUserRoadmaps, setFilteredUserRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customTopic, setCustomTopic] = useState('');
  const [customHours, setCustomHours] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Automatic filtering by creation date - show recent items first (this week)
  const dateFilter = 'week'; // Fixed to show recent items automatically

  useEffect(() => {
    fetchData();
  }, []);

  // Automatic filtering by creation date - show recent items first (this week)
  useEffect(() => {
    let filtered = [...userRoadmaps];
    
    // Automatically filter by date range (this week)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    filtered = filtered.filter(roadmap => {
      const createdDate = new Date(roadmap.created_at);
      const createdDateOnly = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
      return createdDateOnly >= weekAgo;
    });
    
    // Sort by creation date (newest first) to emphasize recent activity
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB - dateA; // Newest first
    });
    
    setFilteredUserRoadmaps(filtered);
  }, [userRoadmaps]);

  const fetchData = async () => {
    try {
      // Fetch predefined roadmap cards
      const cardsResponse = await axios.get('http://localhost:8000/api/roadmap/roadmap_cards/');
      setRoadmapCards(cardsResponse.data.roadmap_cards);

      // Fetch user-created roadmaps
      const userRoadmapsResponse = await axios.get('http://localhost:8000/api/roadmap/user_roadmaps/');
      const roadmaps = userRoadmapsResponse.data.roadmaps;
      setUserRoadmaps(roadmaps);
      
      // No longer extracting purposes since filters are removed
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async (topic, hours = null) => {
    setIsGenerating(true);
    try {
      const params = {
        topic: topic,
        ...(hours && { time: hours }),
        ...(user && { user_id: user.id })
      };
      
      const response = await axios.get('http://localhost:8000/api/roadmap/generate_roadmap/', { params });
      
      console.log('Generated roadmap:', response.data);
      alert(`Roadmap for "${topic}" generated successfully!`);
      
    } catch (error) {
      console.error('Error generating roadmap:', error);
      alert('Failed to generate roadmap. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCardClick = (card) => {
    generateRoadmap(card.title, card.estimated_hours);
  };

  const handleUserRoadmapClick = (roadmap) => {
    console.log('Selected roadmap:', roadmap);
    alert(`Roadmap: ${roadmap.title}\\nItems: ${roadmap.roadmap_data?.roadmap?.length || 0}`);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customTopic.trim()) {
      generateRoadmap(customTopic, customHours || null);
      setCustomTopic('');
      setCustomHours('');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-100';
      case 'Intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'Advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Learning <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Roadmaps</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose from our curated learning paths or create your own custom roadmap to master any skill
          </p>
        </div>

        {/* Custom Roadmap Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Create Custom Roadmap</h2>
          <form onSubmit={handleCustomSubmit} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Enter any topic (e.g., 'Python Programming', 'Digital Marketing')"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="md:w-48">
              <input
                type="number"
                placeholder="Hours (optional)"
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={isGenerating || !customTopic.trim()}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </form>
        </div>

        {/* User Created Roadmaps Section */}
        {userRoadmaps.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Your <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">Created Roadmaps</span>
            </h2>
            
            {/* Automatically showing recent roadmaps (this week) - sorted by newest first */}

            {filteredUserRoadmaps.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
                  <div className="text-6xl mb-4 text-gray-400">�</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No Recent Roadmaps</h3>
                  <p className="text-gray-600 mb-4">
                    No roadmaps created in the past week. Create a new roadmap to get started!
                  </p>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-all"
                  >
                    Create New Roadmap
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredUserRoadmaps.map((roadmap) => (
                <div
                  key={roadmap.id}
                  onClick={() => handleUserRoadmapClick(roadmap)}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 overflow-hidden border-l-4 border-green-500"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">📚</span>
                      <div className="flex items-center space-x-2">
                        {/* New badge for items created today */}
                        {(() => {
                          const today = new Date();
                          const createdDate = new Date(roadmap.created_at);
                          const isToday = createdDate.toDateString() === today.toDateString();
                          return isToday ? (
                            <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                              NEW
                            </span>
                          ) : null;
                        })()}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(roadmap.proficiency)}`}>
                          {roadmap.proficiency}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                          Custom
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{roadmap.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{roadmap.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span className="bg-gray-100 px-2 py-1 rounded">{roadmap.subject}</span>
                      <span className="font-medium">{roadmap.weekly_hours}h/week</span>
                    </div>

                    <div className="text-xs text-gray-400">
                      Created: {new Date(roadmap.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="px-6 pb-4">
                    <button className="w-full py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200">
                      View Roadmap
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* Predefined Roadmap Cards Grid */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Popular <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Learning Paths</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {roadmapCards.map((card) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card)}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 overflow-hidden"
              >
                <div className={`${card.color} h-2`}></div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{card.icon}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(card.difficulty)}`}>
                      {card.difficulty}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{card.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{card.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">{card.category}</span>
                    <span className="font-medium">{card.estimated_hours}h</span>
                  </div>
                </div>
                
                <div className="px-6 pb-4">
                  <button className="w-full py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200">
                    Start Learning
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading Overlay */}
        {isGenerating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-800">Generating your personalized roadmap...</p>
              <p className="text-sm text-gray-600 mt-2">This may take a few moments</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoadmapPage;