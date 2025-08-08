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
          At Learnovo, we believe learning should adapt to you. We design AI-powered personalized study plans that grow with your pace, goals, and performance.
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
          To transform education through personalization. We empower students to study smarter by guiding them with adaptive tools, curated resources, and data-driven feedback.
        </p>

        <h2 style={{ color: '#005f73', fontSize: '1.8rem', marginBottom: '1rem' }}>What We Do</h2>
        <p style={{ color: '#444', fontSize: '1rem', marginBottom: '2.5rem' }}>
          We use machine learning and performance analytics to create dynamic study plans. Whether you're preparing for a competitive exam or mastering core subjects, Learnovo guides your learning like a smart tutor.
        </p>

        {/* Horizontal Cards Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <div style={cardStyle}>
            <h3 style={cardTitle}>Personalized Plans</h3>
            <p style={cardText}>Tailored study paths based on your strengths, goals, and availability.</p>
          </div>
          <div style={cardStyle}>
            <h3 style={cardTitle}>Progress Tracking</h3>
            <p style={cardText}>Monitor improvements and receive adaptive recommendations in real time.</p>
          </div>
          <div style={cardStyle}>
            <h3 style={cardTitle}>AI-Powered Insights</h3>
            <p style={cardText}>Get smarter suggestions with intelligent clustering and filtering.</p>
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
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#003049' }}>Join the Smart Learning Revolution</h2>
        <p style={{ fontSize: '1.1rem', color: '#555', maxWidth: '700px', margin: '0 auto' }}>
          Ready to leave behind one-size-fits-all study plans? Let Learnovo guide your learning journey, one intelligent step at a time.
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
