import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

const AuthenticatedLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 p-6 space-y-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <nav className="space-y-3">
          <Link to="/profile" className="block hover:text-blue-400">👤 Profile</Link>
          <Link to="/studyplans" className="block hover:text-blue-400">📚 Study Plans</Link>
          <button onClick={handleLogout} className="text-red-400 hover:underline">🚪 Logout</button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-black p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthenticatedLayout;
