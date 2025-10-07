import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const DoctorManagementPanel = () => {
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [showRemovalModal, setShowRemovalModal] = useState(false);
  const [doctorToRemove, setDoctorToRemove] = useState(null);
  const [removalReason, setRemovalReason] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    console.log('🔄 Fetching doctors data...');
    setLoading(true);
    setError('');
    try {
      const [resPending, resApproved] = await Promise.all([
        api.get('/doctors/pending'),
        api.get('/doctors')
      ]);
      console.log('✅ Doctors data fetched successfully');
      console.log('📊 Pending doctors:', resPending.data.length);
      console.log('📊 Approved doctors:', resApproved.data.length);
      setPending(resPending.data);
      setApproved(resApproved.data);
    } catch (err) {
      console.error('❌ Error fetching doctors:', err);
      console.error('📍 Error details:', err.response?.data || err.message);
      setError('Failed to fetch doctors: ' + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  const handleApprove = async (doctor) => {
    setProcessingId(doctor._id);
    setError('');
    setSuccess('');
    
    try {
  const response = await api.post(`/admin/doctors/${doctor._id}/approve`, {});
      
      // Show success message with access link
  setSuccess(`✅ Dr. ${doctor.name} approved successfully! Professional email sent with dashboard access link. If you do not see the email in your inbox, please check your spam folder.`);
      
      // Update local state
      setPending(pending.filter(doc => doc._id !== doctor._id));
      
      // Refresh the approved doctors list
      await fetchDoctors();
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (err) {
      setError(`Failed to approve Dr. ${doctor.name}. Please try again.`);
      console.error('Error approving doctor:', err);
    }
    
    setProcessingId(null);
  };

  const handleReject = async (doctor) => {
    setProcessingId(doctor._id);
    setError('');
    setSuccess('');
    
    try {
      await api.post(`/admin/doctors/${doctor._id}/reject`, {
        reason: 'Application requirements not met at this time'
      });
      
  setSuccess(`❌ Dr. ${doctor.name} application rejected. Professional notification email sent. If you do not see the email in your inbox, please check your spam folder.`);
      
      // Update local state
      setPending(pending.filter(doc => doc._id !== doctor._id));
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (err) {
      setError(`Failed to reject Dr. ${doctor.name}. Please try again.`);
      console.error('Error rejecting doctor:', err);
    }
    
    setProcessingId(null);
  };

  const handleRemoveDoctor = async (doctor) => {
    setDoctorToRemove(doctor);
    setShowRemovalModal(true);
  };

  const confirmRemoval = async () => {
    if (!doctorToRemove) return;
    
    setProcessingId(doctorToRemove._id);
    setError('');
    setSuccess('');
    
    try {
      await api.delete(`/admin/doctors/${doctorToRemove._id}/remove`, {
        data: { reason: removalReason || 'Administrative decision' }
      });
      
  setSuccess(`🗑️ Dr. ${doctorToRemove.name} removed successfully. Professional notification email sent. If you do not see the email in your inbox, please check your spam folder.`);
      
      // Update local state
      setApproved(approved.filter(doc => doc._id !== doctorToRemove._id));
      
      // Reset modal state
      setShowRemovalModal(false);
      setDoctorToRemove(null);
      setRemovalReason('');
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (err) {
      setError(`Failed to remove Dr. ${doctorToRemove.name}. Please try again.`);
      console.error('Error removing doctor:', err);
    }
    
    setProcessingId(null);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || statusColors['inactive']}`}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctor management panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white text-2xl">
            👨‍⚕️
          </div>
          <div>
            <h3 className="text-2xl font-bold">Doctor Management</h3>
            <p className="text-purple-100">Approve applications and manage doctor accounts</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl mb-1">⏳</div>
            <div className="text-lg font-bold">{pending.length}</div>
            <div className="text-sm text-purple-100">Pending Applications</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl mb-1">✅</div>
            <div className="text-lg font-bold">{approved.length}</div>
            <div className="text-sm text-purple-100">Approved Doctors</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl mb-1">📧</div>
            <div className="text-lg font-bold">Auto</div>
            <div className="text-sm text-purple-100">Email Notifications</div>
          </div>
        </div>
      </div>

      <div className="p-6 max-h-[60vh] overflow-y-auto">
        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700">
              <span>⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-green-700">
              <span>✅</span>
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Pending Applications */}
        <div className="mb-8">
          <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>⏳</span> Pending Applications
          </h4>
          
          {pending.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-gray-600 font-medium">No pending applications</p>
              <p className="text-gray-500 text-sm">All doctor applications have been processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map(doctor => (
                <div key={doctor._id} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                          👨‍⚕️
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-lg text-gray-900 truncate">Dr. {doctor.name}</h5>
                          <p className="text-gray-600 text-sm truncate">{doctor.email}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(doctor.status)}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div className="bg-white rounded-lg p-3">
                          <span className="font-medium text-gray-700 block">Specialization:</span>
                          <span className="text-gray-600">{doctor.specialization}</span>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <span className="font-medium text-gray-700 block">Experience:</span>
                          <span className="text-gray-600">{doctor.experience} years</span>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <span className="font-medium text-gray-700 block">Mobile:</span>
                          <span className="text-gray-600">{doctor.mobile}</span>
                        </div>
                      </div>
                      {doctor.licenseNumber && (
                        <div className="mt-3 bg-white rounded-lg p-3 text-sm">
                          <span className="font-medium text-gray-700 block">License:</span>
                          <span className="text-gray-600">{doctor.licenseNumber}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-48 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(doctor)}
                        disabled={processingId === doctor._id}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                      >
                        {processingId === doctor._id ? (
                          <>
                            <span className="animate-spin">⚪</span>
                            Approving...
                          </>
                        ) : (
                          <>
                            <span>✅</span>
                            Approve & Send Email
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(doctor)}
                        disabled={processingId === doctor._id}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                      >
                        {processingId === doctor._id ? (
                          <>
                            <span className="animate-spin">⚪</span>
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <span>❌</span>
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved Doctors */}
        <div>
          <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>✅</span> Approved Doctors
          </h4>
          
          {approved.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="text-4xl mb-2">👨‍⚕️</div>
              <p className="text-gray-600 font-medium">No approved doctors yet</p>
              <p className="text-gray-500 text-sm">Approved doctors will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {approved.map(doctor => (
                <div key={doctor._id} className="bg-green-50 rounded-xl p-6 border border-green-200 hover:border-green-300 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                          👨‍⚕️
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-lg text-gray-900 truncate">Dr. {doctor.name}</h5>
                          <p className="text-gray-600 text-sm truncate">{doctor.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getStatusBadge(doctor.status)}
                          <div className="flex items-center gap-1">
                            <div className={`w-3 h-3 rounded-full ${doctor.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span className="text-sm text-gray-600">{doctor.isOnline ? 'Online' : 'Offline'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div className="bg-white rounded-lg p-3">
                          <span className="font-medium text-gray-700 block">Specialization:</span>
                          <span className="text-gray-600">{doctor.specialization}</span>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <span className="font-medium text-gray-700 block">Experience:</span>
                          <span className="text-gray-600">{doctor.experience} years</span>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <span className="font-medium text-gray-700 block">Consultations:</span>
                          <span className="text-gray-600">{doctor.totalConsultations || 0}</span>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <span className="font-medium text-gray-700 block">Rating:</span>
                          <span className="text-gray-600">⭐ {doctor.rating || 'N/A'}</span>
                        </div>
                      </div>
                      {doctor.uniqueAccessLink && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <span className="font-medium text-blue-700 block mb-1">Access Link:</span>
                          <span className="text-blue-600 text-xs break-all font-mono">
                            {window.location.origin}/doctor-dashboard/{doctor.uniqueAccessLink}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col lg:w-40 flex-shrink-0">
                      <button
                        onClick={() => handleRemoveDoctor(doctor)}
                        disabled={processingId === doctor._id}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                      >
                        {processingId === doctor._id ? (
                          <>
                            <span className="animate-spin">⚪</span>
                            Removing...
                          </>
                        ) : (
                          <>
                            <span>🗑️</span>
                            Remove Doctor
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Removal Modal */}
      {showRemovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">
                🗑️
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Remove Doctor</h3>
                <p className="text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Are you sure you want to remove <strong>Dr. {doctorToRemove?.name}</strong>?
              </p>
              <p className="text-sm text-gray-600 mb-4">
                The doctor will be notified via email and their access will be revoked immediately.
              </p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for removal (optional):
              </label>
              <textarea
                value={removalReason}
                onChange={(e) => setRemovalReason(e.target.value)}
                placeholder="Enter reason for removal..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows="3"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRemovalModal(false);
                  setDoctorToRemove(null);
                  setRemovalReason('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoval}
                disabled={processingId === doctorToRemove?._id}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingId === doctorToRemove?._id ? 'Removing...' : 'Remove & Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorManagementPanel;
