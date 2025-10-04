import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const DocumentVerificationPanel = () => {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPendingDocuments();
  }, []);

  const fetchPendingDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/documents/admin/pending');
      setPendingDoctors(response.data.pendingDocuments);
      setError('');
    } catch (err) {
      console.error('Error fetching pending documents:', err);
      setError('Failed to fetch pending documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentAction = async (documentId, action, notes = '', rejectionReason = '') => {
    try {
      setVerifying(true);
      
      await api.put(`/documents/admin/verify/${documentId}`, {
        action,
        notes,
        rejectionReason
      });

      // Refresh the pending documents list
      await fetchPendingDocuments();
      
      // Close document viewer
      setSelectedDocument(null);
      
      alert(`Document ${action}d successfully!`);
      
    } catch (err) {
      console.error(`Error ${action}ing document:`, err);
      alert(`Failed to ${action} document: ${err.response?.data?.error || err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const getDocumentIcon = (documentType, mimetype) => {
    if (mimetype?.includes('image/')) return '🖼️';
    if (mimetype?.includes('pdf')) return '📄';
    if (mimetype?.includes('word')) return '📝';
    
    switch (documentType) {
      case 'license': return '📜';
      case 'degree': return '🎓';
      case 'certificate': return '🏆';
      case 'experience': return '💼';
      case 'photo': return '📸';
      case 'idProof': return '🆔';
      case 'clinicPhoto': return '🏥';
      default: return '📎';
    }
  };

  const getDocumentLabel = (documentType) => {
    const labels = {
      license: 'Medical License',
      degree: 'Degree Certificate',
      certificate: 'Professional Certificate',
      experience: 'Experience Certificate',
      photo: 'Professional Photo',
      idProof: 'Government ID Proof',
      clinicPhoto: 'Clinic Photo'
    };
    return labels[documentType] || documentType;
  };

  const DocumentViewer = ({ document, onClose }) => {
    const [notes, setNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [action, setAction] = useState('');
    
    const isImage = document.mimetype?.includes('image/');
    const isPDF = document.mimetype?.includes('pdf');
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {getDocumentIcon(document.documentType)} {getDocumentLabel(document.documentType)}
              </h3>
              <p className="text-gray-600">
                Uploaded by Dr. {selectedDoctor?.doctor?.name} • {new Date(document.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="flex h-[calc(95vh-200px)]">
            {/* Document Preview */}
            <div className="flex-1 p-6 bg-gray-50 flex items-center justify-center">
              {isImage ? (
                <img
                  src={`/api/documents/secure/${document._id}`}
                  alt={getDocumentLabel(document.documentType)}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : isPDF ? (
                <iframe
                  src={`/api/documents/secure/${document._id}`}
                  className="w-full h-full rounded-lg shadow-lg"
                  title={getDocumentLabel(document.documentType)}
                />
              ) : (
                <div className="text-center">
                  <div className="text-6xl mb-4">{getDocumentIcon(document.documentType)}</div>
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">
                    {getDocumentLabel(document.documentType)}
                  </h4>
                  <p className="text-gray-600 mb-4">
                    File Type: {document.mimetype}
                  </p>
                  <a
                    href={`/api/documents/secure/${document._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
                  >
                    📥 Download & View
                  </a>
                </div>
              )}
              
              {/* Error fallback for images */}
              <div style={{ display: 'none' }} className="text-center">
                <div className="text-6xl mb-4">❌</div>
                <p className="text-gray-600 mb-4">Unable to preview this document</p>
                <a
                  href={`/api/documents/secure/${document._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
                >
                  📥 Download & View
                </a>
              </div>
            </div>

            {/* Verification Panel */}
            <div className="w-96 border-l border-gray-200 p-6 bg-white">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Document Details</h4>
              
              <div className="space-y-3 mb-6">
                <div>
                  <span className="text-sm font-medium text-gray-500">File Name:</span>
                  <p className="text-gray-900">{document.originalName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">File Size:</span>
                  <p className="text-gray-900">{document.humanSize || `${Math.round(document.size / 1024)} KB`}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Upload Date:</span>
                  <p className="text-gray-900">{new Date(document.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    document.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    document.verificationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {document.verificationStatus}
                  </span>
                </div>
              </div>

              {/* Verification Actions */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Add any notes about this document..."
                  />
                </div>

                {action === 'reject' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason *
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      rows={3}
                      placeholder="Please specify why this document is being rejected..."
                      required
                    />
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      if (action === 'approve') {
                        handleDocumentAction(document._id, 'approve', notes);
                      } else {
                        setAction('approve');
                      }
                    }}
                    disabled={verifying}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      action === 'approve' 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    } disabled:opacity-50`}
                  >
                    {action === 'approve' ? '✅ Confirm Approval' : '✅ Approve Document'}
                  </button>

                  <button
                    onClick={() => {
                      if (action === 'reject') {
                        if (!rejectionReason.trim()) {
                          alert('Please provide a rejection reason');
                          return;
                        }
                        handleDocumentAction(document._id, 'reject', notes, rejectionReason);
                      } else {
                        setAction('reject');
                      }
                    }}
                    disabled={verifying}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      action === 'reject' 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    } disabled:opacity-50`}
                  >
                    {action === 'reject' ? '❌ Confirm Rejection' : '❌ Reject Document'}
                  </button>

                  {action && (
                    <button
                      onClick={() => {
                        setAction('');
                        setRejectionReason('');
                      }}
                      className="w-full py-2 px-4 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading pending documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-500 text-xl mr-3">❌</span>
          <div>
            <h3 className="font-semibold text-red-800">Error Loading Documents</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchPendingDocuments}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Verification</h2>
          <p className="text-gray-600">Review and verify doctor submitted documents</p>
        </div>
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-semibold">
          {pendingDoctors.reduce((total, doctor) => total + doctor.documents.length, 0)} Pending Documents
        </div>
      </div>

      {/* Pending Doctors List */}
      {pendingDoctors.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Documents</h3>
          <p className="text-gray-600">All doctor documents have been reviewed!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingDoctors.map((doctorData) => (
            <div key={doctorData.doctor._id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              {/* Doctor Header */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                      👨‍⚕️
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Dr. {doctorData.doctor.name}</h3>
                      <p className="text-gray-600">{doctorData.doctor.specialization}</p>
                      <p className="text-sm text-gray-500">{doctorData.doctor.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                      {doctorData.documents.length} Documents Pending
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents Grid */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {doctorData.documents.map((document) => (
                    <div
                      key={document._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedDoctor(doctorData);
                        setSelectedDocument(document);
                      }}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="text-2xl">
                          {getDocumentIcon(document.documentType, document.mimetype)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {getDocumentLabel(document.documentType)}
                          </h4>
                          <p className="text-sm text-gray-500 truncate">{document.originalName}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Size:</span>
                          <span className="text-gray-900">{Math.round(document.size / 1024)} KB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Uploaded:</span>
                          <span className="text-gray-900">{new Date(document.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <button className="w-full mt-3 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                        📋 Review Document
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => {
            setSelectedDocument(null);
            setSelectedDoctor(null);
          }}
        />
      )}
    </div>
  );
};

export default DocumentVerificationPanel;