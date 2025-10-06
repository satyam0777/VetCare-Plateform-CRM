
import React, { useState } from 'react';
import ReactivationModal from './ReactivationModal';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Login = () => {

  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showReactivation, setShowReactivation] = useState(false);
  const [reactivationReason, setReactivationReason] = useState('');
  const [reactivationLoading, setReactivationLoading] = useState(false);
  const [reactivationMsg, setReactivationMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    // If login fails due to deactivation, show reactivation modal
    if (error && error.toLowerCase().includes('deactivated')) {
      setShowReactivation(true);
    }
    if (success) navigate('/dashboard');
  };

  const handleReactivationSubmit = async () => {
    if (!email || !reactivationReason || reactivationReason.trim().length < 3) return;
    setReactivationLoading(true);
    setReactivationMsg('');
    try {
      await api.post('/auth/request-reactivation', { email, reason: reactivationReason });
      setReactivationMsg('Your reactivation request has been submitted. The admin will review it soon.');
      setShowReactivation(false);
      setReactivationReason('');
    } catch (err) {
      setReactivationMsg('Failed to submit reactivation request. Please try again later.');
    } finally {
      setReactivationLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 px-4">
      {/* VetCare Branding */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl text-white">
            🩺
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900">
            <span className="text-blue-600">Vet</span><span className="text-emerald-600">Care</span>
          </h1>
        </div>
        <p className="text-gray-600 text-lg">Welcome back to your veterinary platform</p>
      </div>

      {/* Reactivation Modal */}
      <ReactivationModal
        isOpen={showReactivation}
        onClose={() => setShowReactivation(false)}
        onSubmit={handleReactivationSubmit}
        reason={reactivationReason}
        setReason={setReactivationReason}
        loading={reactivationLoading}
      />

      {/* Login Form */}
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/30">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
            <p className="text-gray-600">Access your animal healthcare dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">📧</span>
                <input 
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors bg-white/80 backdrop-blur-sm" 
                  type="email" 
                  id="email" 
                  placeholder="Enter your email"
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔒</span>
                <input 
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors bg-white/80 backdrop-blur-sm" 
                  type="password" 
                  id="password" 
                  placeholder="Enter your password"
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
              </div>
              <div className="text-right mt-2">
                <button
                  type="button"
                  className="text-blue-600 hover:text-emerald-600 text-sm font-semibold focus:outline-none"
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot password?
                </button>
              </div>
            </div>


            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <span className="text-red-500">⚠️</span>
                  <span className="text-red-700 text-sm font-medium">{error}</span>
                </div>
                {error.toLowerCase().includes('deactivated') && (
                  <button
                    type="button"
                    className="mt-2 text-blue-600 underline text-sm"
                    onClick={() => setShowReactivation(true)}
                  >
                    Request Reactivation
                  </button>
                )}
              </div>
            )}

            {reactivationMsg && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mt-2 text-emerald-700 text-sm font-medium">
                {reactivationMsg}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚪</span>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account? {' '}
              <button 
                onClick={() => navigate('/register')}
                className="text-blue-600 font-semibold hover:text-emerald-600 transition-colors"
              >
                Create Account
              </button>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button 
              onClick={() => navigate('/')}
              className="w-full text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="text-emerald-600">🔒</span>
          <span>Secure Login</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-600">🩺</span>
          <span>Trusted by 10K+ Farmers</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-600">⚡</span>
          <span>24/7 Support</span>
        </div>
      </div>
    </section>
  );
};

export default Login;
