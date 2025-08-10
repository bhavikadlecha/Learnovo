// Debug script to check what data is being received
console.log('=== DEBUGGING ROADMAP LOADING ===');

// Check localStorage data
const localPlans = localStorage.getItem('studyPlans');
console.log('LocalStorage studyPlans:', localPlans);

if (localPlans) {
  try {
    const parsed = JSON.parse(localPlans);
    console.log('Parsed localStorage data:', parsed);
    console.log('LocalStorage plans count:', parsed.length);
  } catch (e) {
    console.error('Error parsing localStorage:', e);
  }
}

// Check API response
fetch('http://localhost:8000/api/roadmap/user_study_plans/')
  .then(response => {
    console.log('API Response status:', response.status);
    console.log('API Response headers:', response.headers);
    return response.json();
  })
  .then(data => {
    console.log('API Response data:', data);
    console.log('API Response type:', typeof data);
    console.log('API Response length:', Array.isArray(data) ? data.length : 'Not an array');
    if (Array.isArray(data) && data.length > 0) {
      console.log('First item structure:', data[0]);
    }
  })
  .catch(error => {
    console.error('API Error:', error);
  });

console.log('=== END DEBUG ===');
