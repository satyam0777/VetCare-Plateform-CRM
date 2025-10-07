import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import DoctorVerificationPanel from './admin/DoctorVerificationPanel';
import CommissionAnalyticsDashboard from './admin/CommissionAnalyticsDashboard';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    statistics: {},
    recentAppointments: [],
    pendingDoctors: [],
    allDoctors: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin-new/dashboard');
      setDashboardData(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDoctor = async (doctorId) => {
    setActionLoading(true);
    try {
      const response = await api.post(`/admin-new/doctors/${doctorId}/approve`);
      if (response.data.success) {
        // Update the doctor status in our local state
        setDashboardData(prev => ({
          ...prev,
          pendingDoctors: prev.pendingDoctors.filter(doc => doc._id !== doctorId),
          allDoctors: prev.allDoctors.map(doc => 
            doc._id === doctorId 
              ? { ...doc, approved: true, status: 'active' } 
              : doc
          ),
          statistics: {
            ...prev.statistics,
            pendingDoctors: prev.statistics.pendingDoctors - 1,
            activeDoctors: prev.statistics.activeDoctors + 1
          }
        }));
            alert(`✅ Doctor approved successfully! Access link sent to ${response.data.doctor.email}. If you do not see the email in your inbox, please check your spam folder.`);
      }
    } catch (err) {
      console.error('Failed to approve doctor:', err);
      alert('❌ Failed to approve doctor. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDoctor = async (doctorId, reason) => {
    const rejectionReason = reason || prompt('Please provide a reason for rejection:');
    if (!rejectionReason) return;

    setActionLoading(true);
    try {
      const response = await api.post(`/admin-new/doctors/${doctorId}/reject`, {
        reason: rejectionReason
      });
      if (response.data.success) {
        // Update the doctor status in our local state
        setDashboardData(prev => ({
          ...prev,
          pendingDoctors: prev.pendingDoctors.filter(doc => doc._id !== doctorId),
          allDoctors: prev.allDoctors.map(doc => 
            doc._id === doctorId 
              ? { ...doc, approved: false, status: 'rejected' } 
              : doc
          ),
          statistics: {
            ...prev.statistics,
            pendingDoctors: prev.statistics.pendingDoctors - 1
          }
        }));
            alert(`✅ Doctor application rejected. Notification sent to ${response.data.doctor.email}. If you do not see the email in your inbox, please check your spam folder.`);
      }
    } catch (err) {
      console.error('Failed to reject doctor:', err);
      alert('❌ Failed to reject doctor. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivateDoctor = async (doctorId, reason) => {
    const deactivationReason = reason || prompt('Please provide a reason for deactivation:');
    if (!deactivationReason) return;

    setActionLoading(true);
    try {
      const response = await api.post(`/admin-new/doctors/${doctorId}/deactivate`, {
        reason: deactivationReason
      });
      if (response.data.success) {
        // Update the doctor status in our local state
        setDashboardData(prev => ({
          ...prev,
          allDoctors: prev.allDoctors.map(doc => 
            doc._id === doctorId 
              ? { ...doc, status: 'inactive' } 
              : doc
          ),
          statistics: {
            ...prev.statistics,
            activeDoctors: prev.statistics.activeDoctors - 1
          }
        }));
        alert(`✅ Doctor deactivated successfully.`);
      }
    } catch (err) {
      console.error('Failed to deactivate doctor:', err);
      alert('❌ Failed to deactivate doctor. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveDoctor = async (doctorId, doctorName, reason) => {
    const removalReason = reason || prompt('Please provide a reason for permanent removal:');
    if (!removalReason) return;

    const confirmRemoval = confirm(
      `⚠️ WARNING: This will permanently remove Dr. ${doctorName} from the platform.\n\n` +
      `This action:\n` +
      `• Deletes their account permanently\n` +
      `• Invalidates their access link\n` +
      `• Sends them a removal notification email\n` +
      `• Cannot be undone\n\n` +
      `Are you sure you want to proceed?`
    );

    if (!confirmRemoval) return;

    setActionLoading(true);
    try {
      const response = await api.delete(`/admin-new/doctors/${doctorId}/remove`, {
        data: { reason: removalReason }
      });
      if (response.data.success) {
        // Remove doctor from local state
        setDashboardData(prev => ({
          ...prev,
          allDoctors: prev.allDoctors.filter(doc => doc._id !== doctorId),
          statistics: {
            ...prev.statistics,
            totalDoctors: prev.statistics.totalDoctors - 1,
            activeDoctors: prev.statistics.activeDoctors - 1
          }
        }));
            alert(`✅ Dr. ${doctorName} has been permanently removed. Notification email sent. If you do not see the email in your inbox, please check your spam folder.`);
      }
    } catch (err) {
      console.error('Failed to remove doctor:', err);
      alert('❌ Failed to remove doctor. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8 relative z-10" style={{ marginTop: '100px' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-2xl text-white">
            👑
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              <span className="text-blue-600">Admin</span> <span className="text-purple-600">Dashboard</span>
            </h1>
            <p className="text-gray-600">Manage VetCare platform operations</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-sm font-semibold text-gray-800">Total Users</div>
            <div className="text-2xl font-bold text-blue-600">{dashboardData.statistics.totalUsers || 0}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
            <div className="text-3xl mb-2">🩺</div>
            <div className="text-sm font-semibold text-gray-800">Active Doctors</div>
            <div className="text-2xl font-bold text-green-600">{dashboardData.statistics.activeDoctors || 0}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
            <div className="text-3xl mb-2">⏳</div>
            <div className="text-sm font-semibold text-gray-800">Pending Approvals</div>
            <div className="text-2xl font-bold text-orange-600">{dashboardData.statistics.pendingDoctors || 0}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-sm font-semibold text-gray-800">Today's Appointments</div>
            <div className="text-2xl font-bold text-purple-600">{dashboardData.statistics.todayAppointments || 0}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'overview' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white/70 text-gray-700 hover:bg-white'
            }`}
          >
            📊 Overview
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all relative ${
              activeTab === 'pending' 
                ? 'bg-orange-600 text-white shadow-lg' 
                : 'bg-white/70 text-gray-700 hover:bg-white'
            }`}
          >
            ⏳ Pending Doctors
            {dashboardData.statistics.pendingDoctors > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                {dashboardData.statistics.pendingDoctors}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('verification')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'verification' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-white/70 text-gray-700 hover:bg-white'
            }`}
          >
            📋 Document Verification
          </button>
          <button 
            onClick={() => setActiveTab('doctors')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'doctors' 
                ? 'bg-green-600 text-white shadow-lg' 
                : 'bg-white/70 text-gray-700 hover:bg-white'
            }`}
          >
            🩺 All Doctors
          </button>
          <button 
            onClick={() => setActiveTab('appointments')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'appointments' 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'bg-white/70 text-gray-700 hover:bg-white'
            }`}
          >
            📅 Appointments
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'analytics' 
                ? 'bg-teal-600 text-white shadow-lg' 
                : 'bg-white/70 text-gray-700 hover:bg-white'
            }`}
          >
            💰 Commission Analytics
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-2 text-red-700">
            <span>❌</span>
            <span className="font-medium">{error}</span>
            <button 
              onClick={fetchDashboardData}
              className="ml-auto bg-red-100 hover:bg-red-200 px-3 py-1 rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-white/30">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Platform Overview</h2>
            
            {/* Platform Statistics */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">📈 Platform Health</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Success Rate:</span>
                    <span className="font-bold text-blue-900">{dashboardData.statistics.successRate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Total Appointments:</span>
                    <span className="font-bold text-blue-900">{dashboardData.statistics.totalAppointments || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Completed:</span>
                    <span className="font-bold text-green-600">{dashboardData.statistics.completedAppointments || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-green-800 mb-4">🩺 Doctor Network</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-green-700">Total Doctors:</span>
                    <span className="font-bold text-green-900">{dashboardData.statistics.totalDoctors || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Active:</span>
                    <span className="font-bold text-green-600">{dashboardData.statistics.activeDoctors || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Pending:</span>
                    <span className="font-bold text-orange-600">{dashboardData.statistics.pendingDoctors || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Appointments */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 Recent Appointments</h3>
              <div className="space-y-3">
                {dashboardData.recentAppointments.slice(0, 5).map((appointment) => (
                  <div key={appointment._id} className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {appointment.user?.name || 'Unknown User'} → Dr. {appointment.doctor?.name || 'Unknown Doctor'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {appointment.petName} • {new Date(appointment.date).toLocaleDateString()} • {appointment.time}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.status}
                    </div>
                  </div>
                ))}
                {dashboardData.recentAppointments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No recent appointments found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pending Doctors Tab */}
        {activeTab === 'pending' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">⏳ Pending Doctor Approvals</h2>
            
            <div className="space-y-4">
              {dashboardData.pendingDoctors.map((doctor) => (
                <div key={doctor._id} className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-2xl border border-orange-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-xl">
                          🩺
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{doctor.name}</h3>
                          <p className="text-gray-600">{doctor.email}</p>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">📱 Mobile: <span className="font-medium">{doctor.mobile}</span></p>
                          <p className="text-sm text-gray-600">🎓 Specialization: <span className="font-medium">{doctor.specialization}</span></p>
                          <p className="text-sm text-gray-600">🏥 Education: <span className="font-medium">{doctor.education || 'Not provided'}</span></p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">⏰ Experience: <span className="font-medium">{doctor.experience || 0} years</span></p>
                          <p className="text-sm text-gray-600">📄 License: <span className="font-medium">{doctor.licenseNumber || 'Not provided'}</span></p>
                          <p className="text-sm text-gray-600">📅 Applied: <span className="font-medium">{new Date(doctor.createdAt).toLocaleDateString()}</span></p>
                        </div>
                      </div>

                      {doctor.bio && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 font-medium">💬 Bio:</p>
                          <p className="text-sm text-gray-700 bg-white/50 p-3 rounded-lg mt-1">{doctor.bio}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApproveDoctor(doctor._id)}
                        disabled={actionLoading}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => handleRejectDoctor(doctor._id)}
                        disabled={actionLoading}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {dashboardData.pendingDoctors.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
                  <p className="text-gray-600">No pending doctor applications to review.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Document Verification Tab */}
        {activeTab === 'verification' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Document Verification Center</h2>
            <DoctorVerificationPanel />
          </div>
        )}

        {/* All Doctors Tab */}
        {activeTab === 'doctors' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🩺 Doctor Management</h2>
            
            <div className="space-y-4">
              {dashboardData.allDoctors.map((doctor) => (
                <div key={doctor._id} className={`p-6 rounded-2xl border ${
                  doctor.status === 'active' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100' :
                  doctor.status === 'pending' ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-100' :
                  doctor.status === 'rejected' ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-100' :
                  'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-100'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                          doctor.status === 'active' ? 'bg-green-100' :
                          doctor.status === 'pending' ? 'bg-yellow-100' :
                          doctor.status === 'rejected' ? 'bg-red-100' :
                          'bg-gray-100'
                        }`}>
                          🩺
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{doctor.name}</h3>
                          <p className="text-gray-600">{doctor.email}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          doctor.status === 'active' ? 'bg-green-100 text-green-800' :
                          doctor.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          doctor.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {doctor.status}
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                        <p>🎓 {doctor.specialization}</p>
                        <p>⏰ {doctor.experience || 0} years exp.</p>
                        <p>📅 Joined: {new Date(doctor.createdAt).toLocaleDateString()}</p>
                      </div>
                      
                      {/* Document Information */}
                      {doctor.documents && Object.keys(doctor.documents).length > 0 && (
                        <div className="mb-4 p-3 bg-white/50 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            📋 Uploaded Documents
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(doctor.documents).map(([type, path]) => (
                              path && (
                                <button
                                  key={type}
                                  onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'https://vetcare-plateform-crm.onrender.com/api'}/files/${path.split('\\').pop()}`, '_blank')}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md hover:bg-blue-200 transition-colors capitalize"
                                >
                                  📄 {type.replace(/([A-Z])/g, ' $1').trim()}
                                </button>
                              )
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Profile Completeness: {doctor.profileCompleteness || 0}%
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {doctor.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleDeactivateDoctor(doctor._id)}
                            disabled={actionLoading}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            ⏸️ Deactivate
                          </button>
                          <button
                            onClick={() => handleRemoveDoctor(doctor._id, doctor.name)}
                            disabled={actionLoading}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            🗑️ Remove
                          </button>
                        </>
                      )}
                      {doctor.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveDoctor(doctor._id)}
                            disabled={actionLoading}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => handleRejectDoctor(doctor._id)}
                            disabled={actionLoading}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}
                      {(doctor.status === 'inactive' || doctor.status === 'rejected') && (
                        <button
                          onClick={() => handleRemoveDoctor(doctor._id, doctor.name)}
                          disabled={actionLoading}
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          🗑️ Remove Permanently
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {dashboardData.allDoctors.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏥</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Doctors Yet</h3>
                  <p className="text-gray-600">No doctor applications have been submitted.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📅 All Appointments</h2>
            
            <div className="space-y-3">
              {dashboardData.recentAppointments.map((appointment) => (
                <div key={appointment._id} className="bg-gray-50 p-6 rounded-2xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                          🐾
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{appointment.petName}</h3>
                          <p className="text-gray-600">Owner: {appointment.user?.name || 'Unknown'}</p>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p>🩺 Doctor: <span className="font-medium">Dr. {appointment.doctor?.name || 'Unassigned'}</span></p>
                          <p>🎓 Specialization: <span className="font-medium">{appointment.doctor?.specialization || 'N/A'}</span></p>
                        </div>
                        <div>
                          <p>📅 Date: <span className="font-medium">{new Date(appointment.date).toLocaleDateString()}</span></p>
                          <p>⏰ Time: <span className="font-medium">{appointment.time}</span></p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">💬 Reason: <span className="font-medium">{appointment.reason}</span></p>
                      </div>
                    </div>
                    
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.status}
                    </div>
                  </div>
                </div>
              ))}
              
              {dashboardData.recentAppointments.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Appointments</h3>
                  <p className="text-gray-600">No appointments have been scheduled yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Commission Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <CommissionAnalyticsDashboard />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;