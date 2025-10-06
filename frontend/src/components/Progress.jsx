import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  getStudyPlansFromStorage,
  getProgressForPlan,
  calculateProgressStats,
} from "../utils/studyPlanUtils";

const Progress = () => {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [studyPlans, setStudyPlans] = useState([]);
  const [filteredStudyPlans, setFilteredStudyPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to convert purpose values to human-readable labels
  const getPurposeLabel = (purposeValue) => {
    const purposeMap = {
      'academics': 'Academics',
      'competitive_exam': 'Competitive Exam',
      'skill_development': 'Skill Development',
      'career_change': 'Career Change',
      'personal_interest': 'Personal Interest',
      'professional_certification': 'Professional Certification',
      'interview_preparation': 'Interview Preparation',
      'teaching_preparation': 'Teaching Preparation',
      'research': 'Research',
      'other': 'Other',
    };
    return purposeMap[purposeValue] || purposeValue;
  };
  
  // Automatic filtering by creation date - show recent items first (this week)
  const dateFilter = 'week'; // Fixed to show recent items automatically

  useEffect(() => {
    fetchStudyPlans();

    const handleStudyPlansUpdate = () => {
      console.log("Progress: studyPlansUpdated event");
      fetchStudyPlans();
    };

    const handleProgressUpdate = () => {
      console.log("Progress: progressUpdated event");
      fetchStudyPlans();
    };

    window.addEventListener("studyPlansUpdated", handleStudyPlansUpdate);
    window.addEventListener("progressUpdated", handleProgressUpdate);

    return () => {
      window.removeEventListener("studyPlansUpdated", handleStudyPlansUpdate);
      window.removeEventListener("progressUpdated", handleProgressUpdate);
    };
  }, [user]);

  const fetchStudyPlans = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:8000/api/roadmap/user_study_plans/"
      );
      let plans = response.data || [];

      if (plans.length === 0) {
        console.log("No backend data, using localStorage...");
        plans = getLocalStorageStudyPlans();
      }

      setStudyPlans(plans);
    } catch (error) {
      console.log("Backend failed, using localStorage:", error);
      setStudyPlans(getLocalStorageStudyPlans());
    } finally {
      setLoading(false);
    }
  };

  // Automatic filtering by creation date - show recent items first (this week)
  useEffect(() => {
    let filtered = [...studyPlans];
    
    // Automatically filter by date range (this week)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    filtered = filtered.filter(plan => {
      const createdDate = new Date(plan.created_at);
      const createdDateOnly = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
      return createdDateOnly >= weekAgo;
    });
    
    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    setFilteredStudyPlans(filtered);
  }, [studyPlans]);

  const getLocalStorageStudyPlans = () => {
    const plans = getStudyPlansFromStorage();
    return plans.map((plan, index) => ({
      id: plan.id || index + 1,
      main_topic: plan.main_topic || plan.topic || "Unknown Topic",
      available_time: plan.available_time || plan.studyHours || 0,
      created_at: plan.created_at || new Date().toISOString().split("T")[0],
      purpose_of_study: plan.purpose_of_study || plan.studyPurpose || "",
      roadmaps: plan.roadmaps || [],
    }));
  };

  const flattenRoadmap = (items, acc = [], visited = new Set()) => {
    if (!Array.isArray(items)) return acc;

    for (const item of items) {
      const id = item.id?.toString() || item.topic || `topic-${acc.length}`;
      if (visited.has(id)) continue;
      visited.add(id);

      acc.push({
        id,
        label: item.topic || item.title || `Topic ${acc.length + 1}`,
        topic: item.topic || item.title || `Topic ${acc.length + 1}`,
        prerequisites: (item.prerequisites || []).map((p) => p.toString()),
        estimated_time_minutes:
          Math.round(
            (item.estimated_time_hours || item.time_hours || 0) * 60
          ) || item.estimated_time_minutes || 0,
        estimated_time_hours: item.estimated_time_hours || item.time_hours || 0,
      });

      if (Array.isArray(item.subtopics) && item.subtopics.length > 0) {
        flattenRoadmap(item.subtopics, acc, visited);
      }
    }
    return acc;
  };

  const calculateProgress = (plan) => {
    const key = `nodeStatuses_${plan.id}`;
    const planNodeStatuses = JSON.parse(localStorage.getItem(key) || "{}");

    if (Array.isArray(plan.roadmaps)) {
      const syncedProgress = {};
      const flattenedTopics = flattenRoadmap(plan.roadmaps);

      flattenedTopics.forEach((item) => {
        const nodeStatusValue = planNodeStatuses[item.id];
        let nodeStatus = "not-started";

        if (nodeStatusValue === "Completed") nodeStatus = "completed";
        else if (nodeStatusValue === "In Progress") nodeStatus = "in-progress";

        syncedProgress[item.topic] = nodeStatus;
      });

      if (Object.keys(syncedProgress).length > 0) {
        localStorage.setItem(
          `roadmap_progress_${plan.id}`,
          JSON.stringify(syncedProgress)
        );
        return { ...calculateProgressStats(syncedProgress), progress: syncedProgress };
      }
    }

    const progress = getProgressForPlan(plan.id);
    if (Object.keys(progress).length === 0 && Array.isArray(plan.roadmaps)) {
      const initialProgress = {};
      plan.roadmaps.forEach((item, i) => {
        initialProgress[item.topic || item.title || `Topic ${i + 1}`] =
          "not-started";
      });

      localStorage.setItem(
        `roadmap_progress_${plan.id}`,
        JSON.stringify(initialProgress)
      );
      return { ...calculateProgressStats(initialProgress), progress: initialProgress };
    }

    if (Object.keys(progress).length === 0) {
      return {
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        percentage: 0,
        total: 0,
        progress: {},
      };
    }

    return { ...calculateProgressStats(progress), progress };
  };

  const getStatusColor = (status) => {
    if (status === "completed") return "bg-green-500";
    if (status === "in-progress") return "bg-yellow-500";
    return "bg-gray-400";
  };

  const getStatusIcon = (status) => {
    if (status === "completed") return "✓";
    if (status === "in-progress") return "IP";
    return "○";
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your study plans...</p>
        </div>
      </div>
    );
  }

  // Check if user is not logged in
  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
              <div className="text-6xl mb-6 text-blue-400">📊</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Your Progress</h2>
              <p className="text-gray-600 mb-6">
                Sign in to track your learning progress and see detailed statistics across all your study plans.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                >
                  Create Account
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Monitor your learning journey with detailed analytics!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Learning Progress
          </h1>
          <p className="text-gray-600">
            Track your progress across all study plans
          </p>
        </header>

        {/* Automatically showing recent study plans (this week) - sorted by newest first */}

        {studyPlans.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4 text-gray-400">�</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              No Study Plans Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Create your first study plan to start tracking your progress
            </p>
            <button
              onClick={() => (window.location.href = "/form")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Create Study Plan
            </button>
          </div>
        ) : filteredStudyPlans.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
              <div className="text-6xl mb-4 text-gray-400">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Study Plans Match Your Filter</h3>
              <p className="text-gray-600 mb-4">
                Try selecting a different time period to see more results.
              </p>
              <button
                onClick={() => setDateFilter('week')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all"
              >
                Reset Filter
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Study Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredStudyPlans.map((plan) => {
                const stats = calculateProgress(plan);

                return (
                  <div
                    key={plan.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded-full">
                          {plan.available_time}h total
                        </span>
                        {/* NEW badge for items created today */}
                        {(() => {
                          const today = new Date();
                          const createdDate = new Date(plan.created_at);
                          const isToday = createdDate.toDateString() === today.toDateString();
                          return isToday ? (
                            <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                              NEW
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <h3 className="text-xl font-bold mb-1">
                        {plan.main_topic}
                      </h3>
                      <p className="text-blue-100 text-sm">
                        Started {formatDate(plan.created_at)}
                      </p>
                    </div>

                    {/* Card Body */}
                    <div className="p-6">
                      {/* Purpose of Study */}
                      {plan.purpose_of_study && (
                        <div className="mb-4">
                          <div className="flex items-start text-gray-700">
                            <span className="mr-2 mt-0.5">🎯</span>
                            <div>
                              <p className="text-sm font-medium text-gray-500 mb-1">Purpose</p>
                              <p className="text-sm">{getPurposeLabel(plan.purpose_of_study)}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700">
                            Overall Progress
                          </span>
                          <span className="text-2xl font-bold text-gray-800">
                            {stats.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${stats.percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <StatBox
                          value={stats.completed}
                          label="Completed"
                          color="green"
                        />
                        <StatBox
                          value={stats.inProgress}
                          label="In Progress"
                          color="yellow"
                        />
                        <StatBox
                          value={stats.notStarted}
                          label="Not Started"
                          color="gray"
                        />
                      </div>

                      {/* Incomplete Topics */}
                      <button
                        onClick={() =>
                          setSelectedPlan(
                            selectedPlan === plan.id ? null : plan.id
                          )
                        }
                        className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-all font-medium flex justify-between items-center"
                      >
                        <span>
                          View Incomplete Topics (
                          {
                            Object.entries(stats.progress || {}).filter(
                              ([, status]) => status !== "completed"
                            ).length
                          }
                          )
                        </span>
                        <span
                          className="transform transition-transform duration-200"
                          style={{
                            transform:
                              selectedPlan === plan.id
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                          }}
                        >
                          ▼
                        </span>
                      </button>

                      {selectedPlan === plan.id && (
                        <div className="mt-4 border-t border-gray-200 pt-4 max-h-80 overflow-y-auto">
                          <ul className="space-y-3">
                            {Object.entries(stats.progress || {})
                              .filter(([, status]) => status !== "completed")
                              .map(([topic, status]) => (
                                <li
                                  key={topic}
                                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  <span
                                    className={`flex-none w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getStatusColor(
                                      status
                                    )}`}
                                  >
                                    {getStatusIcon(status)}
                                  </span>
                                  <div className="flex-1">
                                    <span className="text-gray-800 font-medium">
                                      {topic}
                                    </span>
                                    <div className="text-xs text-gray-500 capitalize">
                                      {status.replace("-", " ")}
                                    </div>
                                  </div>
                                </li>
                              ))}

                            {Object.entries(stats.progress || {}).filter(
                              ([, status]) => status !== "completed"
                            ).length === 0 && (
                              <li className="text-center py-6 text-gray-500">
                                All topics completed! Great job!
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryBox
                  value={studyPlans.length}
                  label="Active Plans"
                  color="blue"
                />
                <SummaryBox
                  value={studyPlans.reduce(
                    (acc, plan) => acc + calculateProgress(plan).completed,
                    0
                  )}
                  label="Topics Completed"
                  color="green"
                />
                <SummaryBox
                  value={studyPlans.reduce(
                    (acc, plan) => acc + calculateProgress(plan).inProgress,
                    0
                  )}
                  label="Topics In Progress"
                  color="yellow"
                />
                <SummaryBox
                  value={`${studyPlans.reduce(
                    (acc, plan) => acc + plan.available_time,
                    0
                  )}h`}
                  label="Total Study Hours"
                  color="purple"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* --- Small Components --- */
const StatBox = ({ value, label, color }) => (
  <div
    className={`bg-${color}-50 border border-${color}-200 p-3 rounded-lg text-center`}
  >
    <div className={`text-2xl font-bold text-${color}-700`}>{value}</div>
    <div className={`text-xs text-${color}-600 font-medium`}>{label}</div>
  </div>
);

const SummaryBox = ({ value, label, color }) => (
  <div className={`text-center p-4 bg-${color}-50 rounded-lg`}>
    <div className={`text-3xl font-bold text-${color}-600`}>{value}</div>
    <div className={`text-sm text-${color}-600 font-medium`}>{label}</div>
  </div>
);

export default Progress;
