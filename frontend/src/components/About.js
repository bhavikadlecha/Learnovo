import React from 'react';

function AboutUs() {
  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* Hero Header */}
      <section style={{
        backgroundColor: 'rgba(20, 191, 248, 0.21)',
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '3rem', color: '#003049', marginBottom: '1rem' }}>About Learnovo</h1>
        <p style={{ fontSize: '1.2rem', color: '#444', maxWidth: '800px', margin: '0 auto' }}>
          Experience the future of education with Learnovo - an AI-powered learning platform that creates interactive visual roadmaps, tracks your progress in real-time, and adapts to your unique learning style.
        </p>
      </section>

      {/* Info Section */}
      <section style={{
        maxWidth: '1100px',
        margin: '3rem auto',
        padding: '0 2rem',
      }}>
        <h2 style={{ color: '#005f73', fontSize: '1.8rem', marginBottom: '1rem' }}>Our Mission</h2>
        <p style={{ color: '#444', fontSize: '1rem', marginBottom: '2rem' }}>
          To revolutionize personalized education through AI technology. Learnovo transforms traditional learning into an interactive, data-driven experience with visual roadmaps, real-time progress tracking, and intelligent study plan recommendations that adapt to your goals and schedule.
        </p>

        <h2 style={{ color: '#005f73', fontSize: '1.8rem', marginBottom: '1rem' }}>What We Do</h2>
        <p style={{ color: '#444', fontSize: '1rem', marginBottom: '2.5rem' }}>
          Using advanced AI algorithms and the GROQ API, we generate personalized learning roadmaps that visualize your educational journey. Our platform features interactive study plans, comprehensive progress analytics, learning session tracking, and a rich resource library - all designed to make your learning experience more effective and engaging.
        </p>

        {/* Horizontal Cards Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <div style={cardStyle}>
            <h3 style={cardTitle}>AI-Generated Roadmaps</h3>
            <p style={cardText}>Interactive visual learning paths created by AI, showing topic dependencies and optimal study sequences.</p>
          </div>
          <div style={cardStyle}>
            <h3 style={cardTitle}>Real-Time Analytics</h3>
            <p style={cardText}>Comprehensive dashboards with progress charts, learning statistics, and session tracking visualizations.</p>
          </div>
          <div style={cardStyle}>
            <h3 style={cardTitle}>Smart Study Planning</h3>
            <p style={cardText}>Personalized study plans based on your goals, available time, proficiency level, and learning preferences.</p>
          </div>
        </div>

        {/* Additional Features Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginTop: '1.5rem'
        }}>
          <div style={cardStyle}>
            <h3 style={cardTitle}>Learning Session Tracking</h3>
            <p style={cardText}>Monitor your study sessions with detailed time tracking, notes, and progress updates for each topic.</p>
          </div>
          <div style={cardStyle}>
            <h3 style={cardTitle}>Resource Management</h3>
            <p style={cardText}>Access curated learning materials including videos, articles, books, courses, and interactive exercises.</p>
          </div>
          <div style={cardStyle}>
            <h3 style={cardTitle}>Profile & Settings</h3>
            <p style={cardText}>Customize your learning experience with personalized profiles, preferences, and goal management.</p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section style={{
        backgroundColor: 'rgba(20, 191, 248, 0.21)',
        padding: '3rem 2rem',
        textAlign: 'center',
        marginTop: '3rem'
      }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#003049' }}>Transform Your Learning Journey Today</h2>
        <p style={{ fontSize: '1.1rem', color: '#555', maxWidth: '700px', margin: '0 auto' }}>
          Experience intelligent learning with interactive roadmaps, comprehensive analytics, and AI-powered study plans. Join thousands of learners who are already studying smarter with Learnovo's personalized approach to education.
        </p>
      </section>
    </div>
  );
}

const cardStyle = {
  backgroundColor: '#ffffff',
  padding: '1rem',
  borderRadius: '5px',
  boxShadow: '0 4px 10px rgba(20, 191, 248, 0.4)',
  flex: '1 1 28%',
  minWidth: '200px',
  maxWidth: '300px',
};

const cardTitle = {
  fontSize: '1.2rem',
  marginBottom: '1.0rem',
  color: '#003049',
};

const cardText = {
  fontSize: '1rem',
  color: '#444',
};

export default AboutUs;
