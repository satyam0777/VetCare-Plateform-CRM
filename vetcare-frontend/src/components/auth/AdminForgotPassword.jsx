import React, { useState } from 'react';
import api from '../../utils/api';

const AdminForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1: enter email, 2: enter code/new password
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Step 1: Request code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post('/auth/admin/forgot-password', { email });
  setMessage('A reset code has been sent to your email. If you do not see it in your inbox, please check your spam folder.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post('/auth/admin/reset-password', { email, code, newPassword });
      setMessage('Password reset successful! You can now log in.');
      setStep(1);
      setCode('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/30 mt-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Forgot Password</h2>
            <p className="text-gray-600">Reset your admin password securely</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              ❌ {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              ✅ {message}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/80"
                  placeholder="Enter admin email"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50"
              >
                {loading ? 'Sending code...' : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reset Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/80"
                  placeholder="Enter code from email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/80"
                  placeholder="Enter new password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminForgotPassword;
