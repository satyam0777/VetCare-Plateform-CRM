import React, { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'https://vetcare-plateform-crm.onrender.com/api';
import { FiFileText, FiUser, FiPhone, FiCheckCircle, FiXCircle, FiEye, FiDownload, FiTrash2 } from 'react-icons/fi';

const DoctorVerificationPanel = () => {
  console.log(' DoctorVerificationPanel component rendering...');
  
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [doctorToReject, setDoctorToReject] = useState(null);

  useEffect(() => {
    console.log('DoctorVerificationPanel mounted, fetching pending doctors...');
    fetchPendingDoctors();
  }, []);

  const fetchPendingDoctors = async () => {
    try {
      console.log('Making API call to /api/doctors/pending...');
  const response = await fetch(`${API_URL}/doctors/pending`);
      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);
      setPendingDoctors(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pending doctors:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (doctorId) => {
    if (!verificationNotes.trim()) {
      alert('Please add verification notes before approving');
      return;
    }

    setProcessingId(doctorId);
    try {
      const response = await fetch(`/api/doctors/${doctorId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationNotes,
          interviewNotes,
          commissionRate: 85
        }),
      });

      if (response.ok) {
  alert('Doctor approved successfully! Email notification sent. If you do not see the email in your inbox, please check your spam folder.');
        fetchPendingDoctors();
        setSelectedDoctor(null);
        setVerificationNotes('');
        setInterviewNotes('');
      } else {
        alert('Failed to approve doctor');
      }
    } catch (error) {
      console.error('Error approving doctor:', error);
      alert('Error approving doctor');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (doctorId) => {
    const doctor = pendingDoctors.find(d => d._id === doctorId);
    setDoctorToReject(doctor);
    setShowRejectionModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessingId(doctorToReject._id);
    try {
  const response = await fetch(`${API_URL}/doctors/${doctorToReject._id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejectionReason: rejectionReason,
        }),
      });

      if (response.ok) {
  alert('Doctor application rejected successfully. Professional rejection email sent. If you do not see the email in your inbox, please check your spam folder.');
        fetchPendingDoctors();
        setSelectedDoctor(null);
        setVerificationNotes('');
        setInterviewNotes('');
        setShowRejectionModal(false);
        setRejectionReason('');
        setDoctorToReject(null);
      } else {
        alert('Failed to reject doctor');
      }
    } catch (error) {
      console.error('Error rejecting doctor:', error);
      alert('Error rejecting doctor');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelReject = () => {
    setShowRejectionModal(false);
    setRejectionReason('');
    setDoctorToReject(null);
  };

  const handleRemove = async (doctorId) => {
    const confirmRemoval = window.confirm(
      'Are you sure you want to permanently remove this doctor application? This action cannot be undone.'
    );

    if (!confirmRemoval) return;

    setProcessingId(doctorId);
    try {
      const response = await fetch(`/api/doctors/${doctorId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Doctor application removed successfully.');
        fetchPendingDoctors();
        setSelectedDoctor(null);
        setVerificationNotes('');
        setInterviewNotes('');
      } else {
        alert('Failed to remove doctor application');
      }
    } catch (error) {
      console.error('Error removing doctor:', error);
      alert('Error removing doctor application');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (doctor) => {
    const { verificationStatus } = doctor;
    if (verificationStatus?.readyForApproval) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Ready for Approval</span>;
    }
    if (verificationStatus?.documentsUploaded) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending Interview</span>;
    }
    return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Incomplete Documents</span>;
  };

  const getFileExtension = (filename) => {
    return filename ? filename.split('.').pop().toLowerCase() : '';
  };

  const getFileIcon = (filename) => {
    const ext = getFileExtension(filename);
    switch (ext) {
      case 'pdf': return '📄';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      case 'doc':
      case 'docx': return '📝';
      default: return '📁';
    }
  };

  const getLocalFilename = (path) => {
    if (!path) return '';
    // Remove any folder structure, return only the filename
    return path.split('\\').pop().split('/').pop();
  };

  const handleDownload = async (path, doctor, type) => {
    try {
      // If path is a Cloudinary URL, download directly
      if (path.startsWith('http://') || path.startsWith('https://')) {
        const response = await fetch(path);
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const originalExtension = getFileExtension(path);
        const filename = `${doctor.name}_${type}${originalExtension ? '.' + originalExtension : ''}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Otherwise, fallback to local API route, always use just the filename
        const filenameOnly = getLocalFilename(path);
  const response = await fetch(`${API_URL}/files/${filenameOnly}`);
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const originalExtension = getFileExtension(path);
        const filename = `${doctor.name}_${type}${originalExtension ? '.' + originalExtension : ''}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const DocumentViewer = ({ doctor }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {doctor.documents && Object.entries(doctor.documents).map(([type, path]) => (
        <div key={type} className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getFileIcon(path)}</span>
              <div>
                <h4 className="font-medium text-gray-900 capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</h4>
                <p className="text-xs text-gray-500">{getFileExtension(path).toUpperCase()} File</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  if (path.startsWith('http://') || path.startsWith('https://')) {
                    window.open(path, '_blank');
                  } else {
                    const filenameOnly = getLocalFilename(path);
                    window.open(`${API_URL}/files/${filenameOnly}`, '_blank');
                  }
                }}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                title="View Document"
              >
                <FiEye className="w-4 h-4" />
                <span>View</span>
              </button>
              <button
                onClick={() => handleDownload(path, doctor, type)}
                className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm"
                title="Download Document"
              >
                <FiDownload className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {getFileExtension(path) === 'pdf' ? 'PDF Document' : 
             ['jpg', 'jpeg', 'png', 'gif'].includes(getFileExtension(path)) ? 'Image File' : 'Document'}
          </p>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Verification Center</h1>
        <p className="text-gray-600">Review and approve doctor applications with document verification</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Pending Applications ({pendingDoctors.length})
              </h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {pendingDoctors.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <FiCheckCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No pending applications</p>
                </div>
              ) : (
                pendingDoctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    onClick={() => setSelectedDoctor(doctor)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedDoctor?._id === doctor._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">Dr. {doctor.name}</h3>
                        <p className="text-sm text-gray-600">{doctor.specialization}</p>
                        <p className="text-sm text-gray-500">₹{doctor.consultationFee}/consultation</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Profile: {doctor.profileCompleteness}% complete
                        </p>
                      </div>
                      <div className="ml-2">
                        {getStatusBadge(doctor)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Doctor Details */}
        <div className="lg:col-span-2">
          {selectedDoctor ? (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Dr. {selectedDoctor.name} - Verification Details
                  </h2>
                  {getStatusBadge(selectedDoctor)}
                </div>
              </div>

              <div className="p-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <FiUser className="mr-2" />
                      Professional Information
                    </h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Email:</span> {selectedDoctor.email}</p>
                      <p><span className="font-medium">Phone:</span> {selectedDoctor.phone}</p>
                      <p><span className="font-medium">Specialization:</span> {selectedDoctor.specialization}</p>
                      <p><span className="font-medium">Experience:</span> {selectedDoctor.experience} years</p>
                      <p><span className="font-medium">Qualifications:</span> {selectedDoctor.qualifications}</p>
                      <p><span className="font-medium">Consultation Fee:</span> ₹{selectedDoctor.consultationFee}</p>
                      <p><span className="font-medium">Commission:</span> 85% (₹{Math.round(selectedDoctor.consultationFee * 0.85)})</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <FiFileText className="mr-2" />
                      Verification Status
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        {selectedDoctor.verificationStatus?.documentsUploaded ? 
                          <FiCheckCircle className="text-green-500 mr-2" /> : 
                          <FiXCircle className="text-red-500 mr-2" />
                        }
                        <span>Documents Uploaded</span>
                      </div>
                      <div className="flex items-center">
                        <FiPhone className="text-yellow-500 mr-2" />
                        <span>Phone Interview Required</span>
                      </div>
                      <div className="flex items-center">
                        {selectedDoctor.verificationStatus?.profileComplete ? 
                          <FiCheckCircle className="text-green-500 mr-2" /> : 
                          <FiXCircle className="text-red-500 mr-2" />
                        }
                        <span>Profile Complete</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Applied:</span> {new Date(selectedDoctor.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h3>
                  <DocumentViewer doctor={selectedDoctor} />
                </div>

                {/* Verification Notes */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Notes</h3>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Add your verification notes, document review comments, or rejection reasons..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="4"
                  />
                </div>

                {/* Interview Notes */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Phone Interview Notes</h3>
                  <textarea
                    value={interviewNotes}
                    onChange={(e) => setInterviewNotes(e.target.value)}
                    placeholder="Add notes from phone interview, professional verification, etc..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleApprove(selectedDoctor._id)}
                    disabled={processingId === selectedDoctor._id}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                  >
                    <FiCheckCircle className="mr-2" />
                    {processingId === selectedDoctor._id ? 'Processing...' : 'Approve Doctor'}
                  </button>
                  <button
                    onClick={() => handleReject(selectedDoctor._id)}
                    disabled={processingId === selectedDoctor._id}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                  >
                    <FiXCircle className="mr-2" />
                    {processingId === selectedDoctor._id ? 'Processing...' : 'Reject Application'}
                  </button>
                  <button
                    onClick={() => handleRemove(selectedDoctor._id)}
                    disabled={processingId === selectedDoctor._id}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center"
                  >
                    <FiTrash2 className="mr-2" />
                    {processingId === selectedDoctor._id ? 'Processing...' : 'Remove Application'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FiUser className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Doctor to Review</h3>
              <p className="text-gray-600">Choose a pending application from the left panel to view details and documents</p>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Reject Doctor Application
            </h3>
            
            {doctorToReject && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Doctor:</strong> {doctorToReject.name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {doctorToReject.email}
                </p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a professional reason for rejection (e.g., incomplete documentation, qualifications don't meet requirements, etc.)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="4"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be included in the professional rejection email sent to the doctor.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim() || processingId}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center flex-1"
              >
                <FiXCircle className="mr-2" />
                {processingId ? 'Sending...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={handleCancelReject}
                disabled={processingId}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50 flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorVerificationPanel;