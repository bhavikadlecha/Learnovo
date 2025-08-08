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
import Form from './components/Form';
import Progress from './components/Progress';
import RoadmapPage from './components/RoadmapPage';
import PrivateRoute from './components/PrivateRoute';
import { ThemeProvider } from './components/ThemeContext';

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
    <ThemeProvider>
      {showNavbar && <Navbar />}
      <ScrollToHashElement />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        {/* <Route path="/UserProgress" element={<StudyHeatmap />} /> */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/form" element={<Form />} />
        <Route path="/roadmap" element={<RoadmapPage />} />

        {/* Protected Routes under AuthenticatedLayout */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <StudyPlan />
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
        <Route path="/studyplan" element={
          <PrivateRoute>
            <StudyPlan />
          </PrivateRoute>
        } />
        <Route path="/roadmap/:id" element={
          <PrivateRoute>
            <RoadmapPage />
          </PrivateRoute>
        } />
        <Route path="/progress" element={
          <PrivateRoute>
            <Progress />
          </PrivateRoute>
        } />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
