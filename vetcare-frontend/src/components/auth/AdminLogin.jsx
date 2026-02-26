import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const AdminLogin = () => {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
   
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      
      console.log(' Cleared existing localStorage');
      console.log('Attempting admin login with:', { email, password: password.substring(0, 3) + '***' });
      
      const response = await api.post('/auth/login', { email, password });
      
      console.log(' Login response:', { 
        user: response.data.user?.name, 
        role: response.data.user?.role,
        tokenLength: response.data.token?.length 
      });
      
      // Check if the user is actually an admin
      if (response.data.user && response.data.user.role !== 'admin') {
        setError('Access denied. Admin credentials required.');
        return;
      }

      // Store admin credentials
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('userRole', 'admin');
      
      console.log(' Admin credentials stored successfully');
      console.log(' Token preview:', response.data.token.substring(0, 50) + '...');
      
      // Navigate to admin dashboard
      navigate('/admin-dashboard');
    } catch (error) {
      console.error(' Admin login error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 px-4">
      {/* VetCare Admin Branding */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-3xl text-white">
            👑
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">
              <span className="text-purple-600">VetCare</span> <span className="text-pink-600">Admin</span>
            </h1>
            <p className="text-gray-500 text-sm">Administrative Control Panel</p>
          </div>
        </div>
        <p className="text-gray-600 text-lg">Secure admin access to platform management</p>
      </div>

      {/* Admin Login Form */}
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/30">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Login</h2>
            <p className="text-gray-600">Enter your administrative credentials</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/80"
                placeholder="Enter admin email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/80"
                placeholder="Enter admin password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Authenticating...
                </div>
              ) : (
                '🔐 Access Admin Dashboard'
              )}
            </button>
            <div className="text-right mt-2">
              <button
                type="button"
                className="text-sm text-purple-600 hover:underline focus:outline-none"
                onClick={() => navigate('/admin-forgot-password')}
              >
                Forgot Password?
              </button>
            </div>
          </form>

          {/* Security & Access Info */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-blue-800 text-sm mb-2">🔐 Admin Access</h4>
            <div className="text-blue-700 text-sm space-y-1">
              <p>• Admin credentials are securely stored in system configuration</p>
              <p>• Contact system administrator for access credentials</p>
              <p>• All login attempts are monitored and logged</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
            >
              ← Back to Main Site
            </button>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-8 max-w-md text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-center mb-2">
            <span className="text-yellow-600 text-lg">🔒</span>
            <span className="ml-2 font-semibold text-yellow-800 text-sm">Security Notice</span>
          </div>
          <p className="text-yellow-700 text-xs">
            This is a secure admin area. All actions are logged and monitored for security purposes.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AdminLogin;