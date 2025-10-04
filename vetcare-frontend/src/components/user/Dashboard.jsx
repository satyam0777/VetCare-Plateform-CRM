import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorList from './DoctorList';
import AppointmentsPanel from './AppointmentsPanel';
import SupportPanel from './SupportPanel';
import ReportsPanel from './ReportsPanel';
import ProfilePanel from './ProfilePanel';
import BillsPaymentsPanel from './BillsPaymentsPanel';
import PaymentStatusBanner from './PaymentStatusBanner';
import SubscriptionPanel from '../SubscriptionPanel';
import ViewAppointments from './ViewAppointments';
import NotificationCenter from '../common/NotificationCenter';
import ReactModal from 'react-modal';
import api from '../../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let intervalId;
    const fetchDoctors = async () => {
      setError('');
      try {
        const res = await api.get('/doctors');
          setDoctors(res.data);
      } catch (err) {
        setError('Failed to fetch doctors');
      }
      setLoading(false);
    };

    const fetchNotificationCount = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        setUnreadCount(res.data.count || 0);
      } catch (err) {
        console.error('Failed to fetch notification count');
      }
    };

    fetchDoctors();
    fetchNotificationCount();
    intervalId = setInterval(() => {
      fetchDoctors();
      fetchNotificationCount();
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(intervalId);
  }, []);

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 pt-16">
      <div className="p-2 sm:p-4 lg:p-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl text-white">
              🩺
            </div>
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                <span className="text-blue-600">User</span> <span className="text-emerald-600">Dashboard</span>
              </h2>
              <p className="text-sm sm:text-base text-gray-600">Manage your animal healthcare needs</p>
            </div>
            
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(true)}
                className="relative bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl p-3 hover:bg-white/90 transition-all shadow-lg"
              >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Payment Status Banner */}
          <PaymentStatusBanner />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/30">
              <div className="text-xl sm:text-2xl mb-1">👨‍⚕️</div>
              <div className="text-xs sm:text-sm font-semibold text-gray-800">Available Doctors</div>
              <div className="text-sm sm:text-lg font-bold text-blue-600">{doctors.filter(d => d.isAvailable).length}</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/30">
              <div className="text-xl sm:text-2xl mb-1">🔴</div>
              <div className="text-xs sm:text-sm font-semibold text-gray-800">Online Now</div>
              <div className="text-sm sm:text-lg font-bold text-emerald-600">{doctors.filter(d => d.isOnline).length}</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/30">
              <div className="text-xl sm:text-2xl mb-1">⚡</div>
              <div className="text-xs sm:text-sm font-semibold text-gray-800">24/7 Support</div>
              <div className="text-sm sm:text-lg font-bold text-purple-600">Active</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/30">
              <div className="text-xl sm:text-2xl mb-1">🏆</div>
              <div className="text-xs sm:text-sm font-semibold text-gray-800">Your Status</div>
              <div className="text-sm sm:text-lg font-bold text-green-600">Premium</div>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-gradient-to-br from-blue-50/90 to-blue-100/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-blue-100/50" onClick={() => setModal('viewappointments')}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl text-white mb-3 sm:mb-4">🗂️</div>
            <span className="font-bold text-sm sm:text-lg text-gray-900 mb-1 sm:mb-2 text-center">View Appointments</span>
            <span className="text-xs sm:text-sm text-gray-600 text-center">Check your upcoming and past appointments</span>
          </div>

          <div className="bg-gradient-to-br from-emerald-50/90 to-emerald-100/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-emerald-100/50" onClick={() => setModal('doctor')}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl text-white mb-3 sm:mb-4">👨‍⚕️</div>
            <span className="font-bold text-sm sm:text-lg text-gray-900 mb-1 sm:mb-2 text-center">Doctor List</span>
            <span className="text-xs sm:text-sm text-gray-600 text-center">Browse available veterinary experts</span>
          </div>

          <div className="bg-gradient-to-br from-purple-50/90 to-purple-100/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-purple-100/50" onClick={() => setModal('appointments')}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl text-white mb-3 sm:mb-4">📅</div>
            <span className="font-bold text-sm sm:text-lg text-gray-900 mb-1 sm:mb-2 text-center">Book Appointment</span>
            <span className="text-xs sm:text-sm text-gray-600 text-center">Schedule consultation with experts</span>
          </div>

          <div className="bg-gradient-to-br from-orange-50/90 to-orange-100/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-orange-100/50" onClick={() => setModal('support')}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl text-white mb-3 sm:mb-4">💬</div>
            <span className="font-bold text-sm sm:text-lg text-gray-900 mb-1 sm:mb-2 text-center">Support</span>
            <span className="text-xs sm:text-sm text-gray-600 text-center">Get help and emergency assistance</span>
          </div>

          <div className="bg-gradient-to-br from-teal-50/90 to-teal-100/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-teal-100/50" onClick={() => setModal('reports')}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-teal-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl text-white mb-3 sm:mb-4">📋</div>
            <span className="font-bold text-sm sm:text-lg text-gray-900 mb-1 sm:mb-2 text-center">Medical Reports</span>
            <span className="text-xs sm:text-sm text-gray-600 text-center">Download your pet's medical reports</span>
          </div>

          <div className="bg-gradient-to-br from-green-50/90 to-green-100/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-green-100/50" onClick={() => setModal('bills')}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl text-white mb-3 sm:mb-4">💰</div>
            <span className="font-bold text-sm sm:text-lg text-gray-900 mb-1 sm:mb-2 text-center">Bills & Payments</span>
            <span className="text-xs sm:text-sm text-gray-600 text-center">View bills and make payments</span>
          </div>

          <div className="bg-gradient-to-br from-indigo-50/90 to-indigo-100/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-indigo-100/50" onClick={() => setModal('profile')}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl text-white mb-3 sm:mb-4">👤</div>
            <span className="font-bold text-sm sm:text-lg text-gray-900 mb-1 sm:mb-2 text-center">Profile</span>
            <span className="text-xs sm:text-sm text-gray-600 text-center">Manage your account and settings</span>
          </div>

          <div className="bg-gradient-to-br from-pink-50/90 to-pink-100/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-pink-100/50" onClick={() => setModal('subscription')}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-pink-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl text-white mb-3 sm:mb-4">⭐</div>
            <span className="font-bold text-sm sm:text-lg text-gray-900 mb-1 sm:mb-2 text-center">Subscription</span>
            <span className="text-xs sm:text-sm text-gray-600 text-center">Upgrade to premium services</span>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <button 
                onClick={() => setShowNotifications(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              <NotificationCenter onClose={() => setShowNotifications(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main Modal */}
      <ReactModal 
        isOpen={!!modal} 
        onRequestClose={() => setModal('')} 
        ariaHideApp={false} 
        className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[60] p-2 sm:p-4"
        overlayClassName="fixed inset-0 z-[60]"
      >
        <div className={modal === 'doctor' ? 
          "bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-0 w-full h-full sm:w-screen sm:h-screen relative border border-white/30 overflow-hidden" : 
          "bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 w-full max-w-sm sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto relative border border-white/30"
        }>
          <button className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors z-50 shadow-lg text-sm sm:text-base" onClick={() => setModal('')}>
            ✕
          </button>
          {modal === 'doctor' && <DoctorList doctors={doctors} loading={loading} error={error} />}
          {modal === 'appointments' && <AppointmentsPanel doctors={doctors} />}
          {modal === 'viewappointments' && <ViewAppointments />}
          {modal === 'support' && <SupportPanel />}
          {modal === 'reports' && <ReportsPanel />}
          {modal === 'bills' && <BillsPaymentsPanel />}
          {modal === 'profile' && <ProfilePanel />}
          {modal === 'subscription' && <SubscriptionPanel />}
        </div>
      </ReactModal>
    </section>
  );
};

export default Dashboard;