import React, { useEffect, useState } from 'react';

function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('learningPreferences');
    if (stored) {
      setData(JSON.parse(stored));
    }
  }, []);

  if (!data) {
    return <p style={{ textAlign: 'center', marginTop: '2rem' }}>No learning plan found. Please fill out the form.</p>;
  }

  const { subject, topic, proficiency, weeklyHours, deadline } = data;

  const plan = [];
  const totalWeeks = 4;
  for (let i = 1; i <= totalWeeks; i++) {
    plan.push(`Week ${i}: Study ${weeklyHours / totalWeeks} hrs on ${topic}`);
  }

  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', fontFamily: 'Montserrat, sans-serif' }}>
      <h2 style={{ marginBottom: '1rem' }}>📘 Your Study Plan</h2>

      <div style={{ backgroundColor: '#f9f9f9', padding: '1rem 1.5rem', borderRadius: '8px' }}>
        <p><strong>Subject:</strong> {subject}</p>
        <p><strong>Topic:</strong> {topic}</p>
        <p><strong>Proficiency:</strong> {proficiency}</p>
        <p><strong>Weekly Hours:</strong> {weeklyHours} hrs</p>
        <p><strong>Deadline:</strong> {deadline}</p>
      </div>

      <h3 style={{ marginTop: '2rem' }}>🗓 Weekly Breakdown:</h3>
      <ul style={{ lineHeight: '1.8' }}>
        {plan.map((week, index) => (
          <li key={index}>{week}</li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
