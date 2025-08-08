import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const RoadmapPage = () => {
  const [roadmapCards, setRoadmapCards] = useState([]);
  const [userRoadmaps, setUserRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customTopic, setCustomTopic] = useState('');
  const [customHours, setCustomHours] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [showRoadmapDetail, setShowRoadmapDetail] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch predefined roadmap cards
      const cardsResponse = await axios.get('http://localhost:8000/api/roadmap/roadmap_cards/');
      setRoadmapCards(cardsResponse.data.roadmap_cards);

      // Fetch user-created roadmaps
      const userRoadmapsResponse = await axios.get('http://localhost:8000/api/roadmap/user_roadmaps/');
      setUserRoadmaps(userRoadmapsResponse.data.roadmaps);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async (topic, hours = null, fromCard = false) => {
    setIsGenerating(true);
    try {
      if (fromCard) {
        // Create roadmap from predefined card
        const formData = {
          subject: 'General',
          topic: topic,
          proficiency: 'Intermediate',
          weeklyHours: Math.ceil(hours / 10) || 10, // Estimate weekly hours
          deadline: null,
          user_id: user?.id || null
        };
        
        const response = await axios.post('http://localhost:8000/api/roadmap/create_from_form/', formData);
        
        if (response.data.success) {
          // Refresh the roadmaps list
          await fetchData();
          alert(`🎉 Roadmap for "${topic}" created successfully! Check "Your Created Roadmaps" section.`);
        }
      } else {
        // Generate quick roadmap (existing logic)
        const params = {
          topic: topic,
          ...(hours && { time: hours }),
          ...(user && { user_id: user.id })
        };
        
        const response = await axios.get('http://localhost:8000/api/roadmap/generate_roadmap/', { params });
        console.log('Generated roadmap:', response.data);
        alert(`Roadmap for "${topic}" generated successfully!`);
      }
    } catch (error) {
      console.error('Error generating roadmap:', error);
      alert('Failed to generate roadmap. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCardClick = (card) => {
    generateRoadmap(card.title, card.estimated_hours, true); // fromCard = true
  };

  const handleUserRoadmapClick = (roadmap) => {
    console.log('Selected roadmap:', roadmap);
    setSelectedRoadmap(roadmap);
    setShowRoadmapDetail(true);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customTopic.trim()) {
      generateRoadmap(customTopic, customHours || null);
      setCustomTopic('');
      setCustomHours('');
    }
  };

  // Roadmap Detail Modal Component
  const RoadmapDetailModal = ({ roadmap, isOpen, onClose }) => {
    if (!isOpen || !roadmap) return null;

    const roadmapData = roadmap.roadmap_data?.roadmap || [];

    // Build tree structure with proper hierarchy
    const buildHierarchy = (items) => {
      const itemMap = new Map();
      const roots = [];

      // Create map of all items
      items.forEach(item => {
        itemMap.set(item.id, { ...item, children: [] });
        if (item.subtopics) {
          item.subtopics.forEach(subtopic => {
            itemMap.set(subtopic.id, { ...subtopic, children: [] });
          });
        }
      });

      // Build hierarchy based on prerequisites
      itemMap.forEach(item => {
        if (!item.prerequisites || item.prerequisites.length === 0) {
          roots.push(item);
        } else {
          // Find parent based on prerequisites
          item.prerequisites.forEach(prereqId => {
            const parent = itemMap.get(prereqId);
            if (parent) {
              parent.children.push(item);
            }
          });
        }
      });

      // Add subtopics to their parents
      items.forEach(item => {
        if (item.subtopics) {
          const parent = itemMap.get(item.id);
          item.subtopics.forEach(subtopic => {
            const child = itemMap.get(subtopic.id);
            if (parent && child && !parent.children.includes(child)) {
              parent.children.push(child);
            }
          });
        }
      });

      return roots;
    };

    const hierarchy = buildHierarchy(roadmapData);

    const renderTreeNode = (node, level = 0) => {
      const hasChildren = node.children && node.children.length > 0;
      const indent = level * 24;

      return (
        <div key={node.id} className="mb-2">
          {/* Current Node */}
          <div 
            className="relative flex items-start"
            style={{ paddingLeft: `${indent}px` }}
          >
            {/* Tree Lines */}
            {level > 0 && (
              <>
                <div className="absolute left-0 top-0 h-full w-px bg-gray-300" style={{ left: `${indent - 12}px` }}></div>
                <div className="absolute top-6 w-3 h-px bg-gray-300" style={{ left: `${indent - 12}px` }}></div>
              </>
            )}
            
            {/* Node Connector */}
            <div className="flex-shrink-0 w-6 h-6 mr-3 mt-3 relative">
              {hasChildren ? (
                <div className="w-3 h-3 border-2 border-indigo-500 bg-white rounded-full"></div>
              ) : (
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
              )}
              
              {/* Vertical line for children */}
              {hasChildren && (
                <div className="absolute top-6 left-1.5 w-px h-6 bg-gray-300"></div>
              )}
            </div>

            {/* Node Content */}
            <div className="flex-1 bg-white rounded-lg shadow-sm border-l-4 border-indigo-500 p-4 mb-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-semibold text-gray-800">{node.topic}</h4>
                <div className="flex items-center space-x-2">
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                    {node.estimated_time_hours}h
                  </span>
                  {level > 0 && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      L{level}
                    </span>
                  )}
                </div>
              </div>
              
              {node.prerequisites && node.prerequisites.length > 0 && (
                <div className="text-sm text-gray-600 mb-2">
                  <span className="inline-flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Requires: {node.prerequisites.join(', ')}
                  </span>
                </div>
              )}
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Progress: 0%</span>
                <button className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition-colors">
                  Start Topic
                </button>
              </div>
            </div>
          </div>

          {/* Render Children */}
          {hasChildren && (
            <div className="relative">
              {node.children.map(child => renderTreeNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    };

    const totalHours = roadmapData.reduce((total, item) => {
      let itemTotal = item.estimated_time_hours || 0;
      if (item.subtopics) {
        itemTotal += item.subtopics.reduce((subTotal, sub) => subTotal + (sub.estimated_time_hours || 0), 0);
      }
      return total + itemTotal;
    }, 0);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{roadmap.title}</h2>
                <p className="text-indigo-100 mt-1">{roadmap.description}</p>
                <div className="flex items-center space-x-4 mt-3">
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    📚 {roadmap.subject}
                  </span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    🎯 {roadmap.proficiency}
                  </span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    ⏱️ {roadmap.weekly_hours}h/week
                  </span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    🕒 {totalHours}h total
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                <svg className="w-6 h-6 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Learning Pathway Tree ({roadmapData.length} main topics)
              </h3>
              <p className="text-gray-600 mb-4">
                Follow the tree structure from top to bottom. Complete prerequisites before moving to the next level.
              </p>
              
              {hierarchy.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🌳</div>
                  <p>No roadmap structure found</p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  {hierarchy.map(node => renderTreeNode(node))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Created: {new Date(roadmap.created_at).toLocaleDateString()} • 
              Estimated completion: {Math.ceil(totalHours / roadmap.weekly_hours)} weeks
            </div>
            <div className="space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-colors">
                🚀 Begin Learning Journey
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userRoadmaps.map((roadmap) => (
                <div
                  key={roadmap.id}
                  onClick={() => handleUserRoadmapClick(roadmap)}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 overflow-hidden border-l-4 border-green-500"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">📚</span>
                      <div className="flex items-center space-x-2">
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
                    🚀 Create Roadmap
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
    </div>
  );
};

export default RoadmapPage;
