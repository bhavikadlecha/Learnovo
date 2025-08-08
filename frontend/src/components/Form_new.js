import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function LearningPreferencesForm() {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [proficiency, setProficiency] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('');
  const [deadline, setDeadline] = useState('');
  const [warning, setWarning] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0]; // yyyy-mm-dd

  const topicsBySubject = {
    Maths: ['Algebra', 'Calculus', 'Geometry', 'Statistics', 'Trigonometry'],
    Science: ['Physics', 'Biology', 'Chemistry', 'Environmental Science'],
    Programming: ['Python', 'JavaScript', 'C++', 'Java', 'React', 'Node.js', 'Machine Learning', 'Web Development'],
    'Computer Science': ['Data Structures', 'Algorithms', 'Database Systems', 'Operating Systems', 'Computer Networks'],
    Languages: ['Spanish', 'French', 'German', 'Mandarin', 'Japanese'],
    Business: ['Marketing', 'Finance', 'Project Management', 'Entrepreneurship', 'Leadership']
  };

  const handleWeeklyHoursChange = (e) => {
    const value = e.target.value;
    setWeeklyHours(value);

    if (value > 80) {
      setWarning("That's a lot! Make sure to leave time for other things too.");
    } else {
      setWarning('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (weeklyHours > 80) return;

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const formData = { 
      subject, 
      topic, 
      proficiency, 
      weeklyHours: parseInt(weeklyHours), 
      deadline,
      user_id: user?.id || null
    };

    try {
      const response = await axios.post('http://localhost:8000/api/roadmap/create_from_form/', formData);
      
      if (response.data.success) {
        setSuccessMessage(response.data.message);
        
        // Reset form
        setSubject('');
        setTopic('');
        setProficiency('');
        setWeeklyHours('');
        setDeadline('');
        
        // Navigate to roadmap page after a short delay
        setTimeout(() => {
          navigate('/roadmap');
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating roadmap:', error);
      setErrorMessage(error.response?.data?.error || 'Failed to create roadmap. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'Montserrat, sans-serif' }}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', color: '#333' }}>Tell us about your learning goals</h2>

      {successMessage && (
        <div style={{ 
          background: '#d4edda', 
          color: '#155724', 
          padding: '1rem', 
          borderRadius: '5px', 
          marginBottom: '1rem',
          border: '1px solid #c3e6cb'
        }}>
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div style={{ 
          background: '#f8d7da', 
          color: '#721c24', 
          padding: '1rem', 
          borderRadius: '5px', 
          marginBottom: '1rem',
          border: '1px solid #f5c6cb'
        }}>
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Subject */}
        <label>
          Subject:
          <select value={subject} onChange={(e) => setSubject(e.target.value)} required>
            <option value="">-- Select a subject --</option>
            <option value="Maths">Maths</option>
            <option value="Science">Science</option>
            <option value="Programming">Programming</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Languages">Languages</option>
            <option value="Business">Business</option>
          </select>
        </label>

        {/* Topic */}
        {subject && (
          <label>
            Topic:
            <select value={topic} onChange={(e) => setTopic(e.target.value)} required>
              <option value="">-- Select a topic --</option>
              {topicsBySubject[subject]?.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
        )}

        {/* Proficiency */}
        <label>
          Proficiency:
          <select value={proficiency} onChange={(e) => setProficiency(e.target.value)} required>
            <option value="">-- Select proficiency --</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </label>

        {/* Weekly Hours */}
        <label>
          Weekly Study Hours:
          <input
            type="number"
            min="1"
            max="80"
            value={weeklyHours}
            onChange={handleWeeklyHoursChange}
            required
          />
        </label>
        {warning && <p style={{ color: 'red', fontSize: '0.9rem' }}>{warning}</p>}

        {/* Deadline */}
        <label>
          Deadline (Target Completion Date):
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            min={today}
            required
          />
        </label>

        <button
          type="submit"
          disabled={weeklyHours > 80 || isLoading}
          style={{
            padding: '0.75rem 1rem',
            background: isLoading ? '#6c757d' : '#003049',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: (weeklyHours > 80 || isLoading) ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          {isLoading ? 'Creating Your Roadmap...' : 'Generate My Learning Path'}
        </button>
      </form>
    </div>
  );
}

export default LearningPreferencesForm;
