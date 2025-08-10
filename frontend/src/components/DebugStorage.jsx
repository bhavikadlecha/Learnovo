import React from 'react';

const DebugStorage = () => {
  const checkLocalStorage = () => {
    console.log('=== LocalStorage Debug ===');
    
    // Check studyPlans
    const studyPlans = localStorage.getItem('studyPlans');
    console.log('studyPlans raw:', studyPlans);
    
    if (studyPlans) {
      try {
        const parsed = JSON.parse(studyPlans);
        console.log('studyPlans parsed:', parsed);
      } catch (error) {
        console.error('Error parsing studyPlans:', error);
      }
    } else {
      console.log('No studyPlans found in localStorage');
    }
    
    // Check all localStorage keys
    console.log('All localStorage keys:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      console.log(`${key}:`, value);
    }
  };

  const clearStorage = () => {
    if (window.confirm('Are you sure you want to clear all localStorage?')) {
      localStorage.clear();
      console.log('localStorage cleared');
    }
  };

  const triggerRefresh = () => {
    console.log('Triggering studyPlansUpdated event');
    window.dispatchEvent(new CustomEvent('studyPlansUpdated', { 
      detail: { test: true } 
    }));
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Debug LocalStorage</h1>
      
      <div className="space-y-4">
        <button 
          onClick={checkLocalStorage}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Check LocalStorage
        </button>
        
        <button 
          onClick={clearStorage}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Clear LocalStorage
        </button>
        
        <button 
          onClick={triggerRefresh}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Trigger Refresh Event
        </button>
      </div>
      
      <div className="mt-6 text-sm text-gray-600">
        <p>Open browser console (F12) to see the debug output.</p>
      </div>
    </div>
  );
};

export default DebugStorage;
