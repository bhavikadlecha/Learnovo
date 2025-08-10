// axios.js
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8000', // ✅ Update this to your backend base URL if needed
});

// Automatically attach token to request headers
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: Auto-refresh token if expired
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired & not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem('refresh');
        if (!refresh) throw new Error('No refresh token');

        const refreshResponse = await axios.post(
          'http://localhost:8000/api/token/refresh/',
          { refresh }
        );

        const newAccess = refreshResponse.data.access;
        localStorage.setItem('access', newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return instance(originalRequest); // retry original request
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        window.location.href = '/login'; // redirect to login
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
