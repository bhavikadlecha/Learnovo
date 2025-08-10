import React, { useState } from 'react';

function LearningPreferencesForm() {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [proficiency, setProficiency] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('');
  const [deadline, setDeadline] = useState('');
  const [warning, setWarning] = useState('');

  const today = new Date().toISOString().split('T')[0]; // yyyy-mm-dd

  const topicsBySubject = {
    Maths: ['Algebra', 'Calculus', 'Geometry'],
    Science: ['Physics', 'Biology', 'Chemistry'],
    Programming: ['Python', 'JavaScript', 'C++']
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (weeklyHours > 80) return;

    const data = { subject, topic, proficiency, weeklyHours, deadline };
    console.log('Submitted Data:', data);
    // You can send data to backend here
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'Montserrat, sans-serif' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Tell us about your learning goals</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Subject */}
        <label>
          Subject:
          <select value={subject} onChange={(e) => setSubject(e.target.value)} required>
            <option value="">-- Select a subject --</option>
            <option value="Maths">Maths</option>
            <option value="Science">Science</option>
            <option value="Programming">Programming</option>
          </select>
        </label>

        {/* Topic */}
        {subject && (
          <label>
            Topic:
            <select value={topic} onChange={(e) => setTopic(e.target.value)} required>
              <option value="">-- Select a topic --</option>
              {topicsBySubject[subject].map((t) => (
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
          disabled={weeklyHours > 80}
          style={{
            padding: '0.5rem 1rem',
            background: '#003049',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: weeklyHours > 80 ? 'not-allowed' : 'pointer'
          }}
        >
          Generate My Learning Path
        </button>
      </form>
    </div>
  );
}

export default LearningPreferencesForm;
