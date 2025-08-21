import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import './index.css';
import Navbar from './components/Navbar';
import Home from './components/Home';
import About from './components/About';
import StudyPlan from './components/StudyPlan';
import Signup from './components/signup';
import Login from './components/login';
import Profile from './components/Profile';
import Form from './components/Form.jsx';
import Progress from './components/Progress';
import RoadmapPage from './components/RoadmapPage';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Help from './components/Help';
import PrivateRoute from './components/PrivateRoute';
import { ThemeProvider } from './components/ThemeContext';
import { AuthProvider } from './context/AuthContext';

function ScrollToHashElement() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  return null;
}

function App() {
  const location = useLocation();

  // Determine if Navbar should be shown — hide on protected routes
  const showNavbar = !location.pathname.startsWith('/dashboard') &&
                     !location.pathname.startsWith('/profile') &&
                     !location.pathname.startsWith('/StudyPlan');


  // Render the main application layout and routes
  return (
    <AuthProvider>
      <ThemeProvider>
        {showNavbar && <Navbar />}
        <ScrollToHashElement />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/help" element={<Help />} />
          {/* <Route path="/UserProgress" element={<StudyHeatmap />} /> */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/form" element={<Form />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          } />
          <Route path="/studyplan" element={
            <PrivateRoute>
              <StudyPlan />
            </PrivateRoute>
          } />
          
          
          <Route path="/progress" element={
            <PrivateRoute>
              <Progress />
            </PrivateRoute>
          } />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
