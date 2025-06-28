import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import Navbar from './components/Navbar';
import Home from './components/Home';
import About from './components/About';
import Planner from './components/Planner';
import Resources from './components/Resources';
import Progress from './components/Progress';
import Signup from './components/signup';
import LearningPreferencesForm from './components/Form';
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
  return (
    <>
      <Navbar />
      <ScrollToHashElement />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/form" element={<LearningPreferencesForm />} />
        {/* Add more routes as needed */}
        
      </Routes>
    </>
  );
}

export default App;
