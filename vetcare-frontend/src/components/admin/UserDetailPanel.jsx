import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const UserDetailPanel = ({ user, onClose }) => {
  const [fullUser, setFullUser] = useState(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?._id) return;
    setLoading(true);
    setError('');
    api.get(`/admin/users/${user._id}`)
      .then(res => setFullUser(res.data))
      .catch(() => setError('Failed to fetch user details'))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;
  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-2xl shadow-lg">
      <button className="float-right text-gray-500 hover:text-gray-800" onClick={onClose}>✕</button>
      <h3 className="text-2xl font-bold mb-4">User Details</h3>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {fullUser && !loading && !error && (
        <>
          <div className="mb-2"><span className="font-semibold">Name:</span> {fullUser.name}</div>
          <div className="mb-2"><span className="font-semibold">Email:</span> {fullUser.email}</div>
          <div className="mb-2"><span className="font-semibold">Phone:</span> {fullUser.phone || '-'}</div>
          <div className="mb-2"><span className="font-semibold">Role:</span> {fullUser.role}</div>
          <div className="mb-2"><span className="font-semibold">Status:</span> {fullUser.isActive ? 'Active' : 'Inactive'}{fullUser.status ? ` (${fullUser.status})` : ''}</div>
          <div className="mb-2"><span className="font-semibold">Created At:</span> {fullUser.createdAt ? new Date(fullUser.createdAt).toLocaleString() : '-'}</div>
          {fullUser.status === 'deleted' && (
            <div className="mb-2 p-2 bg-yellow-100 text-yellow-800 rounded">This user has been deleted (soft delete).</div>
          )}
        </>
      )}
    </div>
  );
};

export default UserDetailPanel;
