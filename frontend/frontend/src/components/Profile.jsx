import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/profile/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="bg-black min-h-screen text-white p-8">
      <h1 className="text-3xl font-bold mb-4">👤 Profile</h1>

      {!user ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4 text-lg">
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          {/* Add more fields if available from backend */}
          
          <button
            onClick={handleLogout}
            className="mt-6 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default Profile;
