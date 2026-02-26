import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorManagementPanel from './DoctorManagementPanel';
import AppointmentsOverviewPanel from './AppointmentsOverviewPanel';
import SubscriptionPanel from './SubscriptionPanel';
import AnalyticsPanel from './AnalyticsPanel';
import AdminNotificationPanel from './AdminNotificationPanel';
import DoctorVerificationPanel from './DoctorVerificationPanel';
import UserListPanel from './UserListPanel';
import UserDetailPanel from './UserDetailPanel';
import ReactivationRequestsPanel from './ReactivationRequestsPanel';
        <div className="bg-gradient-to-br from-cyan-50/90 to-cyan-100/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-cyan-100/50" onClick={() => handleModalOpen('reactivation')}>
          <div className="w-16 h-16 bg-cyan-600 rounded-2xl flex items-center justify-center text-3xl text-white mb-4">🔄</div>
          <span className="font-bold text-lg text-gray-900 mb-2">Reactivation Requests</span>
          <span className="text-sm text-gray-600 text-center">Review and manage user reactivation requests</span>
        </div>

const Dashboard = () => {
  const [modal, setModal] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  const handleModalOpen = (modalType) => {
    console.log('Opening modal:', modalType);
    console.log('Current modal state before:', modal);
    setModal(modalType);
    console.log(' Modal should now be:', modalType);
    
    // Test if modal is actually being set
    setTimeout(() => {
      console.log(' Modal state after timeout:', modal);
    }, 100);
  };

  const handleModalClose = () => {
    console.log(' Closing modal');
    setModal('');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/admin-login');
  };
  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 p-4 md:p-8 relative z-10" style={{ marginTop: '50px' }}>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-2xl text-white">
              👑
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gray-900">
                <span className="text-purple-600">Admin</span> <span className="text-blue-600">Dashboard</span>
              </h2>
              <p className="text-gray-600">Manage your veterinary platform</p>
            </div>
          </div>
          <button
            onClick={handleAdminLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            🚪 Admin Logout
          </button>
        </div>
        
        {/* Admin Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
            <div className="text-2xl mb-1">👨‍⚕️</div>
            <div className="text-sm font-semibold text-gray-800">Total Doctors</div>
            <div className="text-lg font-bold text-purple-600">500+</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
            <div className="text-2xl mb-1">📅</div>
            <div className="text-sm font-semibold text-gray-800">Total Appointments</div>
            <div className="text-lg font-bold text-blue-600">12,450</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-sm font-semibold text-gray-800">Active Users</div>
            <div className="text-lg font-bold text-emerald-600">10K+</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-sm font-semibold text-gray-800">Revenue</div>
            <div className="text-lg font-bold text-green-600">₹5.2L</div>
          </div>
        </div>
      </div>

      {/* Admin Dashboard Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-6">
        <div className="bg-gradient-to-br from-purple-50/90 to-purple-100/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-purple-100/50" onClick={() => handleModalOpen('doctor')}>
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-3xl text-white mb-4">🧑‍⚕️</div>
          <span className="font-bold text-lg text-gray-900 mb-2">Doctor Management</span>
          <span className="text-sm text-gray-600 text-center">Approve, manage and oversee veterinary doctors</span>
        </div>

        {/* Reactivation Requests Card */}
        <div className="bg-gradient-to-br from-cyan-50/90 to-cyan-100/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-cyan-100/50" onClick={() => handleModalOpen('reactivation')}>
          <div className="w-16 h-16 bg-cyan-600 rounded-2xl flex items-center justify-center text-3xl text-white mb-4">🔄</div>
          <span className="font-bold text-lg text-gray-900 mb-2">Reactivation Requests</span>
          <span className="text-sm text-gray-600 text-center">Review and manage user reactivation requests</span>
        </div>

        <div className="bg-gradient-to-br from-blue-50/90 to-blue-100/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-blue-100/50" onClick={() => handleModalOpen('appointments')}>
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl text-white mb-4">📅</div>
          <span className="font-bold text-lg text-gray-900 mb-2">Appointments Overview</span>
          <span className="text-sm text-gray-600 text-center">Monitor all platform appointments and schedules</span>
        </div>

        <div className="bg-gradient-to-br from-red-50/90 to-red-100/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-red-100/50" onClick={() => handleModalOpen('verification')}>
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-3xl text-white mb-4">📋</div>
          <span className="font-bold text-lg text-gray-900 mb-2">Document Verification</span>
          <span className="text-sm text-gray-600 text-center">Review and verify doctor applications</span>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/90 to-emerald-100/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-emerald-100/50" onClick={() => handleModalOpen('subscription')}>
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-3xl text-white mb-4">💳</div>
          <span className="font-bold text-lg text-gray-900 mb-2">Subscription Model</span>
          <span className="text-sm text-gray-600 text-center">Manage pricing and subscription plans</span>
        </div>

        <div className="bg-gradient-to-br from-orange-50/90 to-orange-100/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-orange-100/50" onClick={() => handleModalOpen('analytics')}>
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-3xl text-white mb-4">📊</div>
          <span className="font-bold text-lg text-gray-900 mb-2">Analytics</span>
          <span className="text-sm text-gray-600 text-center">View platform insights and performance metrics</span>
        </div>

        <div className="bg-gradient-to-br from-yellow-50/90 to-yellow-100/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-yellow-100/50" onClick={() => handleModalOpen('users')}>
          <div className="w-16 h-16 bg-yellow-600 rounded-2xl flex items-center justify-center text-3xl text-white mb-4">👥</div>
          <span className="font-bold text-lg text-gray-900 mb-2">User Management</span>
          <span className="text-sm text-gray-600 text-center">View and manage all users</span>
        </div>
      </div>

      {/* Notification Management */}
      <div className="mt-8">
        <div className="bg-gradient-to-br from-pink-50/90 to-pink-100/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-pink-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-600 rounded-2xl flex items-center justify-center text-2xl text-white">📢</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Notification Center</h3>
                <p className="text-gray-600">Send announcements and updates to users</p>
              </div>
            </div>
            <button
              onClick={() => handleModalOpen('notifications')}
              className="bg-pink-600 text-white px-6 py-3 rounded-xl hover:bg-pink-700 transition-colors font-medium"
            >
              📢 Manage Notifications
            </button>
          </div>
        </div>
      </div>

      {/* Modal using conditional rendering instead of ReactModal */}
      {modal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[9999] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto relative border border-gray-200">
            <button 
              className="absolute top-6 right-6 w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors z-10" 
              onClick={handleModalClose}
            >
              ✕
            </button>
            <div className="p-6 pt-16">
              {modal === 'doctor' && <DoctorManagementPanel />}
              {modal === 'appointments' && <AppointmentsOverviewPanel />}
              {modal === 'verification' && <DoctorVerificationPanel />}
              {modal === 'subscription' && <SubscriptionPanel />}
              {modal === 'analytics' && <AnalyticsPanel />}
              {modal === 'notifications' && <AdminNotificationPanel onClose={handleModalClose} />}
              {modal === 'users' && (
                <>
                  <UserListPanel onSelectUser={setSelectedUser} />
                  {selectedUser && <UserDetailPanel user={selectedUser} onClose={() => setSelectedUser(null)} />}
                </>
              )}
              {modal === 'reactivation' && <ReactivationRequestsPanel />}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Dashboard;
