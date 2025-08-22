import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Help = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [showContactForm, setShowContactForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const faqs = [
    {
      question: "How do I create a study plan?",
      answer: "Navigate to the Study Plan section and click 'Create New Plan'. Fill in your learning goals, preferred schedule, and subjects you want to focus on.",
      category: "study-plans"
    },
    {
      question: "How can I track my progress?",
      answer: "Visit the Progress page to view your learning analytics, completed sessions, and achievement milestones. You can also see visual representations of your learning journey.",
      category: "progress"
    },
    {
      question: "Can I modify my study plan after creating it?",
      answer: "Yes! You can edit your study plan at any time. Go to your Dashboard, select the plan you want to modify, and click the edit option.",
      category: "study-plans"
    },
    {
      question: "How do notifications work?",
      answer: "You can enable notifications in Settings to receive reminders for study sessions, progress updates, and achievement notifications.",
      category: "settings"
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we take data security seriously. All your personal information and learning data are encrypted and stored securely. Check our Privacy Policy for more details.",
      category: "privacy"
    },
    {
      question: "How do I reset my password?",
      answer: "Click on 'Forgot Password' on the login page, enter your email address, and follow the instructions sent to your email.",
      category: "account"
    },
    {
      question: "Can I share my study plans with others?",
      answer: "Yes! You can make your study plans public in the Privacy settings, allowing other learners to view and use your plans.",
      category: "sharing"
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission
    setSubmitMessage('Thank you for contacting us! We\'ll get back to you within 24 hours.');
    setContactForm({ name: '', email: '', subject: '', message: '' });
    setShowContactForm(false);
    setTimeout(() => setSubmitMessage(''), 5000);
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    // Simulate feedback submission
    setSubmitMessage('Thank you for your feedback! Your input helps us improve Learnovo.');
    setShowFeedbackForm(false);
    setTimeout(() => setSubmitMessage(''), 5000);
  };

  const quickActions = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of using Learnovo',
      icon: 'GS',
      action: () => navigate('/dashboard')
    },
    {
      title: 'Study Plans',
      description: 'Create and manage your learning plans',
      icon: 'SP',
      action: () => navigate('/studyplan')
    },
    {
      title: 'Account Settings',
      description: 'Manage your profile and preferences',
      icon: 'AS',
      action: () => navigate('/settings')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Help Center</h1>
              <p className="text-gray-600">Find answers to common questions and get support</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>

          {submitMessage && (
            <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-700 border border-green-200">
              {submitMessage}
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {quickActions.map((action, index) => (
              <div 
                key={index}
                onClick={action.action}
                className="bg-blue-50 p-6 rounded-lg text-center cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl">{action.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-gray-600 text-sm">{action.description}</p>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {searchQuery ? `Search Results (${filteredFaqs.length})` : 'Frequently Asked Questions'}
            </h2>
            {filteredFaqs.length > 0 ? (
              <div className="space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {faq.category}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No results found for "{searchQuery}". Try different keywords.</p>
              </div>
            )}
          </div>

          {/* Contact Support Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Still need help?</h3>
            <p className="text-gray-600 mb-4">
              Can't find the answer you're looking for? Contact our support team and we'll get back to you as soon as possible.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowContactForm(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </button>
              <button 
                onClick={() => setShowFeedbackForm(true)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                💬 Send Feedback
              </button>
            </div>
          </div>

          {/* Contact Form Modal */}
          {showContactForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Support</h3>
                <form onSubmit={handleContactSubmit}>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Your Email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Subject"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <textarea
                      placeholder="Describe your issue..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                      required
                    />
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Send Message
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowContactForm(false)}
                      className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Feedback Form Modal */}
          {showFeedbackForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Send Feedback</h3>
                <form onSubmit={handleFeedbackSubmit}>
                  <div className="space-y-4">
                    <textarea
                      placeholder="What can we improve? Share your thoughts..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                      required
                    />
                    <div className="text-sm text-gray-600">
                      Your feedback helps us make Learnovo better for everyone!
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Send Feedback
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFeedbackForm(false)}
                      className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Help;
