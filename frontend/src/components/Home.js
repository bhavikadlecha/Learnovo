import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import HeroSlider from './Hero';

function Home() {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollToHero) {
      const hero = document.getElementById('hero');
      if (hero) {
        hero.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  return (
    <div>
      <HeroSlider />
      
      {/* How to Use Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
               How to Use
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your complete guide to mastering our AI-powered learning platform
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Step 1: Create Study Plan */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                  1
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Create Your Study Plan</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Start by creating a personalized study plan. Enter your learning topic and available study hours.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-medium">Example:</p>
                <p className="text-blue-700">Topic: "Python Programming" | Hours: 40</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
              <h4 className="text-xl font-bold mb-4">What You Get:</h4>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  AI-generated learning roadmap
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Interactive visual progress tracking
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Estimated time for each topic
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Prerequisite-based learning path
                </li>
              </ul>
            </div>
          </div>

          {/* Step 2: Interactive Roadmap */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-800 mb-4">
                Interactive Learning Roadmap
              </h3>
              <p className="text-gray-600 text-lg">
                Your personalized roadmap shows up as an interactive visual graph with clickable nodes
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Three Status Cards */}
              <div className="bg-gray-50 border-2 border-blue-300 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-blue-400 rounded-lg mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg">
                  NS
                </div>
                <h4 className="text-lg font-bold text-blue-700 mb-2">Not Started</h4>
                <p className="text-blue-600 text-sm">blue nodes indicate topics you haven't begun yet</p>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-yellow-500 rounded-lg mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg">
                  IP
                </div>
                <h4 className="text-lg font-bold text-yellow-700 mb-2">In Progress</h4>
                <p className="text-yellow-600 text-sm">yellow nodes show topics you're currently learning</p>
              </div>

              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-green-500 rounded-lg mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg">
                  ✓
                </div>
                <h4 className="text-lg font-bold text-green-700 mb-2">Completed</h4>
                <p className="text-green-600 text-sm">Green nodes represent mastered topics</p>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <h5 className="font-bold text-black-800 mb-2">How to Interact:</h5>
              <ul className="text-indigo-700 space-y-1">
                <li>• <strong>Click any node</strong> to cycle through: Not Started → In Progress → Completed</li>
                <li>• <strong>Click again</strong> to change status and track your learning journey</li>
                <li>• <strong>View details</strong> like estimated time and prerequisites for each topic</li>
                <li>• <strong>Reset progress</strong> anytime with the reset button</li>
              </ul>
            </div>
          </div>

          {/* Step 3: Progress Tracking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-8 text-white">
              <h4 className="text-2xl font-bold mb-4">Smart Progress Tracking</h4>
              <p className="mb-4">
                Monitor your learning journey with real-time progress analytics
              </p>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-300 rounded-full mr-3"></div>
                  <span>Overall completion percentage</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-300 rounded-full mr-3"></div>
                  <span>Topics in progress counter</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-300 rounded-full mr-3"></div>
                  <span>Detailed topic breakdown</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h4 className="text-2xl font-bold text-gray-800 mb-4">Features You'll Love</h4>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 mt-1">
                    P
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-700">Study Plan Overview</h5>
                    <p className="text-gray-600 text-sm">View all your study plans with progress cards</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 mt-1">
                    A
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-700">Progress Analytics</h5>
                    <p className="text-gray-600 text-sm">Detailed statistics and completion tracking</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 mt-1">
                    G
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-700">Goal Achievement</h5>
                    <p className="text-gray-600 text-sm">Track incomplete topics and stay motivated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
              <h3 className="text-3xl font-bold mb-4">Ready to Start Learning?</h3>
              <p className="text-xl mb-6 opacity-90">
                Create your first study plan and experience AI-powered learning
              </p>
              <a 
                href="/form" 
                className="inline-block bg-white text-purple-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors duration-200 transform hover:scale-105"
              >
                Create My Study Plan
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
