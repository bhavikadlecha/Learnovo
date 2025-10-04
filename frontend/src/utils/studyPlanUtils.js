// Shared utility functions for study plan data management

// Helper function to get user-specific localStorage key
const getUserSpecificKey = (baseKey, userId = null) => {
  // Try to get user ID from localStorage if not provided
  if (!userId) {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        userId = user.id || user.email; // Use ID or email as fallback
      }
    } catch (error) {
      console.warn('Could not get user data for localStorage key:', error);
    }
  }
  
  // If we have a user ID, make the key user-specific
  return userId ? `${baseKey}_user_${userId}` : baseKey;
};

export const getStudyPlansFromStorage = (userId = null) => {
  try {
    const key = getUserSpecificKey('studyPlans', userId);
    const data = localStorage.getItem(key);
    console.log('getStudyPlansFromStorage - key:', key, 'raw data:', data);
    const parsed = data ? JSON.parse(data) : [];
    console.log('getStudyPlansFromStorage - parsed data:', parsed);
    return parsed;
  } catch (error) {
    console.error('Error reading study plans from localStorage:', error);
    return [];
  }
};

export const saveStudyPlanToStorage = (newPlan, userId = null) => {
  try {
    console.log('saveStudyPlanToStorage called with:', newPlan);
    const existing = getStudyPlansFromStorage(userId);
    console.log('Existing plans:', existing);
    
    const updatedPlans = [...existing, newPlan];
    console.log('Updated plans array:', updatedPlans);
    
    const key = getUserSpecificKey('studyPlans', userId);
    localStorage.setItem(key, JSON.stringify(updatedPlans));
    console.log('Saved to localStorage successfully with key:', key);
    
    // Dispatch a custom event to notify other components
    window.dispatchEvent(new CustomEvent('studyPlansUpdated', { 
      detail: { plans: updatedPlans } 
    }));
    console.log('Dispatched studyPlansUpdated event');
    
    return true;
  } catch (error) {
    console.error('Error saving study plan to localStorage:', error);
    return false;
  }
};

export const deleteStudyPlanFromStorage = (planId, userId = null) => {
  try {
    const existing = getStudyPlansFromStorage(userId);
    const updatedPlans = existing.filter(plan => plan.id !== planId);
    
    const key = getUserSpecificKey('studyPlans', userId);
    localStorage.setItem(key, JSON.stringify(updatedPlans));
    
    // Also remove progress data for this plan (make it user-specific)
    const progressKey = getUserSpecificKey(`roadmap_progress_${planId}`, userId);
    const nodeStatusKey = getUserSpecificKey(`nodeStatuses_${planId}`, userId);
    
    localStorage.removeItem(progressKey);
    localStorage.removeItem(nodeStatusKey);
    
    // Dispatch a custom event to notify other components
    window.dispatchEvent(new CustomEvent('studyPlansUpdated', { 
      detail: { plans: updatedPlans } 
    }));
    
    return true;
  } catch (error) {
    console.error('Error deleting study plan from localStorage:', error);
    return false;
  }
};

export const initializeProgressForPlan = (planId, roadmaps, userId = null) => {
  try {
    if (roadmaps && Array.isArray(roadmaps)) {
      const initialProgress = {};
      
      // Flatten the roadmap to handle nested subtopics
      const flattenRoadmapForProgress = (items) => {
        const result = [];
        for (const item of items) {
          result.push(item);
          if (item.subtopics && Array.isArray(item.subtopics)) {
            result.push(...flattenRoadmapForProgress(item.subtopics));
          }
        }
        return result;
      };
      
      const flatRoadmaps = flattenRoadmapForProgress(roadmaps);
      console.log('Initializing progress for flattened roadmap:', flatRoadmaps);
      
      flatRoadmaps.forEach((item, index) => {
        const topicName = item.topic || item.title || `Topic ${index + 1}`;
        initialProgress[topicName] = 'not-started';
      });
      
      const key = getUserSpecificKey(`roadmap_progress_${planId}`, userId);
      localStorage.setItem(key, JSON.stringify(initialProgress));
      console.log('Initialized progress data:', initialProgress, 'with key:', key);
      return initialProgress;
    }
    return {};
  } catch (error) {
    console.error('Error initializing progress:', error);
    return {};
  }
};

export const updateTopicProgress = (planId, topicName, newStatus, userId = null) => {
  try {
    const key = getUserSpecificKey(`roadmap_progress_${planId}`, userId);
    const currentProgress = JSON.parse(localStorage.getItem(key)) || {};
    currentProgress[topicName] = newStatus;
    localStorage.setItem(key, JSON.stringify(currentProgress));
    
    // Dispatch event to notify components of progress update
    window.dispatchEvent(new CustomEvent('progressUpdated', { 
      detail: { planId, topicName, status: newStatus } 
    }));
    
    return true;
  } catch (error) {
    console.error('Error updating topic progress:', error);
    return false;
  }
};

export const getProgressForPlan = (planId, userId = null) => {
  try {
    const key = getUserSpecificKey(`roadmap_progress_${planId}`, userId);
    const savedProgress = localStorage.getItem(key);
    return savedProgress ? JSON.parse(savedProgress) : {};
  } catch (error) {
    console.error('Error getting progress for plan:', error);
    return {};
  }
};

export const calculateProgressStats = (progress) => {
  if (!progress || Object.keys(progress).length === 0) {
    return { completed: 0, inProgress: 0, notStarted: 0, percentage: 0, total: 0 };
  }
  
  const counts = {
    completed: 0,
    inProgress: 0,
    notStarted: 0
  };
  
  Object.values(progress).forEach(status => {
    // Handle both formats: 'completed'/'Completed' and 'in-progress'/'In Progress'
    const normalizedStatus = status.toLowerCase().replace(/[\s-]/g, '');
    if (normalizedStatus === 'completed') counts.completed++;
    else if (normalizedStatus === 'inprogress') counts.inProgress++;
    else counts.notStarted++;
  });
  
  const total = Object.keys(progress).length;
  const percentage = total > 0 ? Math.round((counts.completed / total) * 100) : 0;
  
  return {
    ...counts,
    total,
    percentage
  };
};
