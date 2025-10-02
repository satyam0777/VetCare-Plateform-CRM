
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Register = () => {
  const { register, loading, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Only send mobile if provided
    const success = await register(name, email, mobile || undefined, password);
    if (success) navigate('/dashboard');
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 px-4 py-8">
      {/* VetCare Branding */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-2xl text-white">
            🩺
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900">
            <span className="text-blue-600">Vet</span><span className="text-emerald-600">Care</span>
          </h1>
        </div>
        <p className="text-gray-600 text-lg">Join thousands of farmers and pet owners</p>
      </div>

      {/* Register Form */}
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/30">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600">Start your animal healthcare journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="name">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">👤</span>
                <input 
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors bg-white/80 backdrop-blur-sm" 
                  type="text" 
                  id="name" 
                  placeholder="Enter your full name"
                  required 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">📧</span>
                <input 
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors bg-white/80 backdrop-blur-sm" 
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
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="mobile">
                Mobile Number <span className="text-sm text-gray-500 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">📱</span>
                <input 
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors bg-white/80 backdrop-blur-sm" 
                  type="tel" 
                  id="mobile" 
                  placeholder="Enter your mobile number"
                  value={mobile} 
                  onChange={e => setMobile(e.target.value)} 
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
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors bg-white/80 backdrop-blur-sm" 
                  type="password" 
                  id="password" 
                  placeholder="Create a strong password"
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <span className="text-red-500">⚠️</span>
                  <span className="text-red-700 text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚪</span>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account? {' '}
              <button 
                onClick={() => navigate('/login')}
                className="text-emerald-600 font-semibold hover:text-blue-600 transition-colors"
              >
                Sign In
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

      {/* Features Preview */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/30">
          <div className="text-2xl mb-2">🩺</div>
          <div className="text-sm font-semibold text-gray-800">Expert Vets</div>
          <div className="text-xs text-gray-600">500+ Certified Doctors</div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/30">
          <div className="text-2xl mb-2">⚡</div>
          <div className="text-sm font-semibold text-gray-800">Instant Care</div>
          <div className="text-xs text-gray-600">24/7 Emergency Support</div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/30">
          <div className="text-2xl mb-2">🏆</div>
          <div className="text-sm font-semibold text-gray-800">Trusted</div>
          <div className="text-xs text-gray-600">10K+ Happy Farmers</div>
        </div>
      </div>
    </section>
  );
};

export default Register;
