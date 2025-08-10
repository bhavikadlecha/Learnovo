// src/components/Sidebar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-6">
      <h2 className="text-xl font-bold mb-8">Your Dashboard</h2>
      <nav className="space-y-4">
        <Link to="/StudyPlans" className="block hover:underline">📘 Study Plans</Link>
        <Link to="/progress" className="block hover:underline">📊 Progress</Link>
        <Link to="/profile" className="block hover:underline">👤 Profile</Link>
        <button onClick={logout} className="mt-8 text-red-400 hover:underline">🚪 Logout</button>
      </nav>
    </div>
  );
};

export default Sidebar;
