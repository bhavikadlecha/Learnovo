import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link'; // for smooth scroll
import { useEffect } from 'react';

function BarGraphLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="16" width="4" height="12" fill="#61dafb" />
      <rect x="10" y="10" width="4" height="18" fill="#21a1f3" />
      <rect x="16" y="6" width="4" height="22" fill="#1b7fc2" />
      <rect x="22" y="2" width="4" height="26" fill="#145a86" />
    </svg>
  );
}

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoClick = (e) => {
    e.preventDefault();

    if (location.pathname !== '/') {
      navigate('/#hero');
    } else {
      const hero = document.getElementById('hero');
      if (hero) {
        hero.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav style={{
      padding: '1rem 2rem',
      background: 'black',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', width: '100%' }}>
        <a
          href="/#hero"
          onClick={handleLogoClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'white',
            gap: '0.5rem',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}
        >
          <BarGraphLogo />
          <span>Learnovo</span>
        </a>

        <ul style={{
          display: 'flex',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          gap: '1.5rem'
        }}>
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
          <NavLink to="/" style={navLinkStyle}>Home</NavLink>
          <NavLink to="/about" style={navLinkStyle}>About us</NavLink>
          <NavLink to="/planner" style={navLinkStyle}>Study Plan</NavLink>
          <NavLink to="/progress" style={navLinkStyle}>Progress</NavLink>
          <NavLink to="/signup" style={signupBtnStyle}>Sign Up</NavLink>
        </div>
      </div>
    </nav>
  );
}

const navLinkStyle = {
  color: 'white',
  textDecoration: 'none',
  fontSize: '1rem',
  fontWeight: 500,
  transition: 'color 0.2s',
};

const signupBtnStyle = {
  padding: '0.5rem 1.1rem',
  borderRadius: '6px',
  backgroundColor: '#61dafb',
  color: '#282c34',
  fontWeight: 'bold',
  textDecoration: 'none'
};

export default Navbar;
