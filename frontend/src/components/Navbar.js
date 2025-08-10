import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function BarGraphLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="16" width="4" height="12" fill="#61dafb" rx="2" />
      <rect x="10" y="10" width="4" height="18" fill="#21a1f3" rx="2" />
      <rect x="16" y="6" width="4" height="22" fill="#1b7fc2" rx="2" />
      <rect x="22" y="2" width="4" height="26" fill="#145a86" rx="2" />
    </svg>
  );
}

function UserProfileDropdown({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-800 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {user?.profile_picture ? (
            <img
              src={user.profile_picture}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            getInitials(user?.username || user?.first_name || 'User')
          )}
        </div>
        <svg 
          className={`w-4 h-4 text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user?.first_name || user?.username}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          
          <NavLink
            to="/profile"
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            My Profile
          </NavLink>
          
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Dashboard
          </NavLink>
          
          <NavLink
            to="/settings"
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </NavLink>
          
          <NavLink
            to="/help"
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Help
          </NavLink>
          
          <hr className="my-2" />
          
          <button
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, user, logout } = useAuth();

  const handleLogoClick = (e) => {
    e.preventDefault();

    if (location.pathname !== '/') {
      navigate('/', { state: { scrollToHero: true } });
    } else {
      const hero = document.getElementById('hero');
      if (hero) {
        hero.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      padding: '1rem 2rem',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
    }}>
      {/* Logo Section */}
      <a
        href="/#hero"
        onClick={handleLogoClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none',
          color: 'white',
          gap: '0.75rem',
          fontWeight: 'bold',
          fontSize: '1.4rem',
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        <BarGraphLogo />
        <span>Learnovo</span>
      </a>

      {/* Center Menu Items */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
      }}>
        <NavLink 
          to="/" 
          style={navLinkStyle}
          className="nav-link"
        >
          <span>Home</span>
        </NavLink>
        <NavLink 
          to="/about" 
          style={navLinkStyle}
          className="nav-link"
        >
          <span>About</span>
        </NavLink>
        
        <NavLink 
          to="/studyplan" 
          style={navLinkStyle}
          className="nav-link"
        >
          <span>Study Plan</span>
        </NavLink>
        {isLoggedIn && (
          <NavLink 
            to="/progress" 
            style={navLinkStyle}
            className="nav-link"
          >
            <span>Progress</span>
          </NavLink>
        )}
      </div>

      {/* Auth Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {isLoggedIn ? (
          <UserProfileDropdown user={user} onLogout={handleLogout} />
        ) : (
          <NavLink 
            to="/login" 
            style={loginBtnStyle}
            className="login-btn"
          >
            <svg style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Login
          </NavLink>
        )}
      </div>
    </nav>
  );
}

const navLinkStyle = {
  color: 'white',
  textDecoration: 'none',
  fontSize: '1rem',
  fontWeight: 500,
  transition: 'all 0.3s ease',
  padding: '0.5rem 1rem',
  borderRadius: '8px',
  position: 'relative',
  overflow: 'hidden',
};

const loginBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '0.75rem 1.5rem',
  borderRadius: '25px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  fontWeight: 600,
  textDecoration: 'none',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
  border: 'none',
  cursor: 'pointer',
};

export default Navbar;
