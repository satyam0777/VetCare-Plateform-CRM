import React, { useEffect, useState } from 'react';
import ReasonModal from './ReasonModal';
import api from '../../utils/api';

const UserListPanel = ({ onSelectUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state for reason input
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUser, setModalUser] = useState(null);
  const [modalType, setModalType] = useState('soft'); // 'soft' or 'hard'
  const [reason, setReason] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/admin/users');
        setUsers(res.data);
      } catch (err) {
        setError('Failed to fetch users');
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);


  // Soft delete user handler

  const handleDelete = (user) => {
    setModalUser(user);
    setModalType('soft');
    setReason('');
    setModalOpen(true);
  };

  // Hard delete user handler

  const handleHardDelete = (user) => {
    setModalUser(user);
    setModalType('hard');
    setReason('');
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalUser(null);
    setReason('');
  };

  const handleModalSubmit = async () => {
    if (!modalUser || !reason || reason.trim().length < 3) return;
    try {
      setLoading(true);
      if (modalType === 'soft') {
        await api.patch(`/admin/users/${modalUser._id}/delete`, { reason });
        setUsers((prev) => prev.map(u => u._id === modalUser._id ? { ...u, isActive: false, status: 'deleted' } : u));
      } else {
        await api.delete(`/admin/users/${modalUser._id}/hard-delete`, { data: { reason } });
        setUsers((prev) => prev.filter(u => u._id !== modalUser._id));
      }
      handleModalClose();
    } catch (err) {
      alert('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-xl font-bold mb-4">All Users</h3>
      {loading && <div>Loading users...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <ReasonModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        reason={reason}
        setReason={setReason}
        actionType={modalType}
      />
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead>
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} className="hover:bg-gray-100">
                <td className="px-4 py-2">{user.name}</td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.phone || '-'}</td>
                <td className="px-4 py-2">{user.role}</td>
                <td className="px-4 py-2">{user.isActive ? 'Active' : 'Inactive'}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    onClick={() => onSelectUser(user)}
                  >
                    View
                  </button>
                  {/* Only allow soft delete for non-admin/owner users who are active */}
                  {user.role !== 'admin' && user.role !== 'owner' && user.isActive && (
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      onClick={() => handleDelete(user)}
                    >
                      Delete
                    </button>
                  )}
                  {/* Only allow hard delete for non-admin/owner users who are already soft-deleted */}
                  {user.role !== 'admin' && user.role !== 'owner' && user.status === 'deleted' && (
                    <button
                      className="bg-black text-white px-3 py-1 rounded hover:bg-gray-800"
                      onClick={() => handleHardDelete(user)}
                    >
                      Hard Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserListPanel;
