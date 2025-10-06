
import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import AdminResponseModal from './AdminResponseModal';

const ReactivationRequestsPanel = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, userId: null, approve: null });

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/admin/reactivation-requests');
        setRequests(res.data);
      } catch (err) {
        setError('Failed to fetch reactivation requests');
      }
      setLoading(false);
    };
    fetchRequests();
  }, []);

  const handleRespond = (userId, approve) => {
    setModal({ open: true, userId, approve });
  };

  const handleModalClose = () => {
    setModal({ open: false, userId: null, approve: null });
  };

  const handleModalSubmit = async (adminResponse) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/reactivation-requests/${modal.userId}/respond`, { approve: modal.approve, adminResponse });
      setRequests((prev) => prev.filter(r => r._id !== modal.userId));
      handleModalClose();
    } catch (err) {
      alert('Failed to process request');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-xl font-bold mb-4">User Reactivation Requests</h3>
      {loading && <div>Loading requests...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead>
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Reason</th>
              <th className="px-4 py-2">Requested At</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req._id} className="hover:bg-gray-100">
                <td className="px-4 py-2">{req.name}</td>
                <td className="px-4 py-2">{req.email}</td>
                <td className="px-4 py-2 whitespace-pre-line">{req.reactivationRequest?.reason}</td>
                <td className="px-4 py-2">{req.reactivationRequest?.requestedAt ? new Date(req.reactivationRequest.requestedAt).toLocaleString() : '-'}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    className="bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700"
                    onClick={() => handleRespond(req._id, true)}
                    disabled={actionLoading}
                  >
                    Approve
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    onClick={() => handleRespond(req._id, false)}
                    disabled={actionLoading}
                  >
                    Reject
                  </button>
                </td>
      {/* Admin Response Modal */}
      <AdminResponseModal
        isOpen={modal.open}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        loading={actionLoading}
      />
              </tr>
            ))}
            {requests.length === 0 && !loading && (
              <tr><td colSpan={5} className="text-center py-4 text-gray-500">No pending requests</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReactivationRequestsPanel;
