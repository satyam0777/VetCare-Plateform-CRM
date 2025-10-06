import { useState } from 'react';
import api from '../utils/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login
  const login = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setLoading(false);
      return true;
    } catch (err) {
      // Prefer backend error message, handle deactivation (403) clearly
      let backendMsg = err.response?.data?.message || err.response?.data?.msg || 'Login failed';
      if (err.response?.status === 403 && backendMsg.toLowerCase().includes('deactivat')) {
        setError(backendMsg);
      } else {
        setError(backendMsg);
      }
      setLoading(false);
      return false;
    }
  };

  // Register
  const register = async (name, email, mobile, password) => {
    setLoading(true);
    setError('');
    try {
      // Only send mobile if provided
      const payload = { name, email, password };
      if (mobile) payload.mobile = mobile;
      const res = await api.post('/auth/register', payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.msg || 'Registration failed');
      setLoading(false);
      return false;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return { user, loading, error, login, register, logout };
}
