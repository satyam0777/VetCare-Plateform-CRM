import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const AdminNotificationPanel = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('announcement');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Check if admin is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    if (token && userRole === 'admin') {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  // Announcement form state
  const [announcement, setAnnouncement] = useState({
    title: '',
    message: '',
    recipientRole: 'all',
    priority: 'medium'
  });

  // Individual notification form state
  const [individualNotif, setIndividualNotif] = useState({
    recipientId: '',
    title: '',
    message: '',
    type: 'system_announcement',
    priority: 'medium'
  });

  const handleSendAnnouncement = async () => {
    if (!announcement.title || !announcement.message) {
      setMessage('Please fill in all required fields');
      return;
    }

    // Debug token information
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const userRole = localStorage.getItem('userRole');
    
    console.log('🔍 Token Debug before sending announcement:');
    console.log('Token exists:', !!token);
    console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'No token');
    console.log('User role:', userRole);
    console.log('User:', user ? JSON.parse(user) : 'No user');

    setLoading(true);
    try {
      console.log('📤 Sending announcement request with data:', announcement);
      const response = await api.post('/notifications/send-announcement', announcement);
      setMessage(`✅ Announcement sent to ${response.data.recipientCount} users`);
      setAnnouncement({ title: '', message: '', recipientRole: 'all', priority: 'medium' });
    } catch (error) {
      console.error('❌ Announcement error:', error.response?.data || error.message);
      setMessage(`❌ Error: ${error.response?.data?.error || 'Failed to send announcement'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendIndividual = async () => {
    if (!individualNotif.recipientId || !individualNotif.title || !individualNotif.message) {
      setMessage('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/notifications/send-to-user', individualNotif);
      setMessage(`✅ Notification sent to ${response.data.notification.recipient}`);
      setIndividualNotif({ recipientId: '', title: '', message: '', type: 'system_announcement', priority: 'medium' });
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.error || 'Failed to send notification'}`);
    } finally {
      setLoading(false);
    }
  };

  const predefinedTemplates = {
    maintenance: {
      title: '🔧 Scheduled Maintenance',
      message: 'VetCare will undergo scheduled maintenance on [DATE] from [TIME] to [TIME]. Services may be temporarily unavailable.'
    },
    newFeature: {
      title: '🎉 New Feature Launch',
      message: 'We\'re excited to announce our new [FEATURE NAME] feature! Now you can [FEATURE DESCRIPTION].'
    },
    emergency: {
      title: '🚨 Emergency Alert',
      message: 'Important: [EMERGENCY DETAILS]. Please take necessary action immediately.'
    },
    promotion: {
      title: '💰 Special Offer',
      message: 'Limited time offer: Get [DISCOUNT]% off on [SERVICE]. Valid until [DATE].'
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">📢 Admin Notification Center</h2>
              <p className="text-purple-100">Send announcements and notifications to users</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs - only show when logged in */}
        {isLoggedIn && (
          <div className="border-b border-gray-200">
            <div className="flex space-x-4 px-6">
              <button
                onClick={() => setActiveTab('announcement')}
                className={`py-3 px-4 border-b-2 transition-colors ${
                  activeTab === 'announcement'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📢 Broadcast Announcement
              </button>
              <button
                onClick={() => setActiveTab('individual')}
                className={`py-3 px-4 border-b-2 transition-colors ${
                  activeTab === 'individual'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                👤 Individual Notification
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`py-3 px-4 border-b-2 transition-colors ${
                  activeTab === 'templates'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📋 Templates
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* Message Display */}
          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}

          {/* Admin Login Required Message (if not logged in) */}
          {!isLoggedIn && (
            <div className="space-y-4 max-w-md mx-auto text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                🔐
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Admin Login Required</h3>
              <p className="text-gray-600">You need to login as an administrator to access the notification management system.</p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <h4 className="font-medium text-blue-800 mb-2">🚀 Quick Access</h4>
                <p className="text-blue-700 mb-3">Use the dedicated admin login page for secure access.</p>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/admin-login');
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  👑 Go to Admin Login
                </button>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                <h4 className="font-medium text-yellow-800 mb-1">💡 Demo Access</h4>
                <p className="text-yellow-700">For demo purposes, use:</p>
                <p className="text-yellow-700 font-mono text-xs mt-1">Use Environment Variables for Admin Access</p>
              </div>
            </div>
          )}

          {/* Main Content (only show if logged in) */}
          {isLoggedIn && (
            <>
              {/* Broadcast Announcement Tab */}
              {activeTab === 'announcement' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Send Broadcast Announcement</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={announcement.title}
                    onChange={(e) => setAnnouncement({...announcement, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter announcement title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Role *
                  </label>
                  <select
                    value={announcement.recipientRole}
                    onChange={(e) => setAnnouncement({...announcement, recipientRole: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Users</option>
                    <option value="farmer">Farmers</option>
                    <option value="user">Regular Users</option>
                    <option value="doctor">All Doctors</option>
                    <option value="admin">All Admins</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={announcement.priority}
                  onChange={(e) => setAnnouncement({...announcement, priority: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  value={announcement.message}
                  onChange={(e) => setAnnouncement({...announcement, message: e.target.value})}
                  rows="4"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your announcement message"
                />
              </div>

              <button
                onClick={handleSendAnnouncement}
                disabled={loading}
                className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : '📢 Send Announcement'}
              </button>
            </div>
          )}

          {/* Individual Notification Tab */}
          {activeTab === 'individual' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Send Individual Notification</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient User ID *
                  </label>
                  <input
                    type="text"
                    value={individualNotif.recipientId}
                    onChange={(e) => setIndividualNotif({...individualNotif, recipientId: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter user ID (e.g., 68da5f8bfa6a51a7b8932daa)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={individualNotif.title}
                    onChange={(e) => setIndividualNotif({...individualNotif, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter notification title"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={individualNotif.type}
                    onChange={(e) => setIndividualNotif({...individualNotif, type: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="system_announcement">System Announcement</option>
                    <option value="appointment_reminder">Appointment Reminder</option>
                    <option value="payment_reminder">Payment Reminder</option>
                    <option value="emergency_alert">Emergency Alert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={individualNotif.priority}
                    onChange={(e) => setIndividualNotif({...individualNotif, priority: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  value={individualNotif.message}
                  onChange={(e) => setIndividualNotif({...individualNotif, message: e.target.value})}
                  rows="4"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your notification message"
                />
              </div>

              <button
                onClick={handleSendIndividual}
                disabled={loading}
                className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : '📤 Send Notification'}
              </button>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Notification Templates</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(predefinedTemplates).map(([key, template]) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h4 className="font-medium text-gray-900 mb-2">{template.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{template.message}</p>
                    <button
                      onClick={() => {
                        setAnnouncement({
                          ...announcement,
                          title: template.title,
                          message: template.message
                        });
                        setActiveTab('announcement');
                      }}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 transition-colors"
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationPanel;