import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppointmentsPanel from './AppointmentsPanel';
import PatientDetailsPanel from './PatientDetailsPanel';
import ConsultationPanel from './ConsultationPanel';
import ReportsPanel from './ReportsPanel';
import BankingPanel from './BankingPanel';
import DoctorProfileSection from './DoctorProfileSection';
import DoctorProfile from './DoctorProfile';
import DoctorNotificationPanel from './DoctorNotificationPanel';
import useDoctorStats from '../../hooks/useDoctorStats';

const Dashboard = () => {
  const navigate = useNavigate();
  const { link } = useParams();
  const [modal, setModal] = useState('');
  const { stats, loading, error } = useDoctorStats();
  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50 p-4 md:p-8 relative z-10" style={{ marginTop: '50px' }}>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-2xl text-white">
            🩺
          </div>
          <div>
            <h2 className="text-4xl font-bold text-gray-900">
              <span className="text-emerald-600">Doctor</span> <span className="text-blue-600">Dashboard</span>
            </h2>
            <p className="text-gray-600">Manage your veterinary practice</p>
          </div>
        </div>
        
        {/* Doctor Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
            <div className="text-2xl mb-1">📅</div>
            <div className="text-sm font-semibold text-gray-800">Today's Appointments</div>
            <div className="text-lg font-bold text-emerald-600">
              {loading ? '...' : error ? '0' : stats.todayAppointments}
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
            <div className="text-2xl mb-1">🐄</div>
            <div className="text-sm font-semibold text-gray-800">Animals Treated</div>
            <div className="text-lg font-bold text-blue-600">
              {loading ? '...' : error ? '0' : stats.totalPatients}
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
            <div className="text-2xl mb-1">⭐</div>
            <div className="text-sm font-semibold text-gray-800">Rating</div>
            <div className="text-lg font-bold text-yellow-600">
              {loading ? '...' : error ? '0' : `${stats.rating}/5`}
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
            <div className="text-2xl mb-1">🔴</div>
            <div className="text-sm font-semibold text-gray-800">Status</div>
            <div className={`text-lg font-bold ${stats.status === 'online' ? 'text-green-600' : 'text-gray-500'}`}>
              {loading ? '...' : error ? 'Offline' : stats.status === 'online' ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-2 text-red-700">
              <span>⚠️</span>
              <span className="font-medium text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Doctor Profile Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-white/30">
            <DoctorProfileSection />
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-white/30">
            <DoctorProfile />
          </div>
        </div>
      </div>




      {/* Doctor Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-emerald-50/90 to-emerald-100/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-emerald-100/50" onClick={() => setModal('appointments')}>
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-3xl text-white mb-4">📅</div>
          <span className="font-bold text-lg text-gray-900 mb-2">Appointments</span>
          <span className="text-sm text-gray-600 text-center">Manage your consultation schedule and bookings</span>
        </div>

        <div className="bg-gradient-to-br from-blue-50/90 to-blue-100/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-blue-100/50" onClick={() => setModal('patient')}>
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl text-white mb-4">🐄</div>
          <span className="font-bold text-lg text-gray-900 mb-2">Patient Details</span>
          <span className="text-sm text-gray-600 text-center">View animal health records and treatment history</span>
        </div>

        <div className="bg-gradient-to-br from-purple-50/90 to-purple-100/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-purple-100/50" onClick={() => setModal('consultation')}>
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-3xl text-white mb-4">💬</div>
          <span className="font-bold text-lg text-gray-900 mb-2">Consultation Tools</span>
          <span className="text-sm text-gray-600 text-center">Video calls, prescriptions and diagnostic tools</span>
        </div>

        <div className="bg-gradient-to-br from-orange-50/90 to-orange-100/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-orange-100/50" onClick={() => navigate(`/doctor-dashboard/${link}/reports`)}>
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-3xl text-white mb-4">📊</div>
          <span className="font-bold text-lg text-gray-900 mb-2">Reports & Analytics</span>
          <span className="text-sm text-gray-600 text-center">Track your practice performance and insights</span>
        </div>

        <div className="bg-gradient-to-br from-green-50/90 to-green-100/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-green-100/50" onClick={() => setModal('banking')}>
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-3xl text-white mb-4">🏦</div>
          <span className="font-bold text-lg text-gray-900 mb-2">Banking & Earnings</span>
          <span className="text-sm text-gray-600 text-center">Manage payouts and view earnings</span>
        </div>
      </div>

      {/* Notification Management */}
      <div className="mt-8">
        <div className="bg-gradient-to-br from-cyan-50/90 to-cyan-100/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-cyan-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-600 rounded-2xl flex items-center justify-center text-2xl text-white">👨‍⚕️</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Patient Communication</h3>
                <p className="text-gray-600">Send updates and notifications to your patients</p>
              </div>
            </div>
            <button
              onClick={() => setModal('notifications')}
              className="bg-cyan-600 text-white px-6 py-3 rounded-xl hover:bg-cyan-700 transition-colors font-medium"
            >
              📤 Send Patient Updates
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
              onClick={() => setModal('')}
            >
              ✕
            </button>
            <div className="p-6 pt-16">
              {modal === 'appointments' && <AppointmentsPanel doctorLink={link} />}
              {modal === 'patient' && <PatientDetailsPanel />}
              {modal === 'consultation' && <ConsultationPanel />}
              {modal === 'reports' && <ReportsPanel doctorLink={link} />}
              {modal === 'banking' && <BankingPanel />}
              {modal === 'notifications' && <DoctorNotificationPanel doctorId={link} onClose={() => setModal('')} />}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Dashboard;
