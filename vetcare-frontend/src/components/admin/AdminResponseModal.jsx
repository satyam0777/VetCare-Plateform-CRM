import React, { useState } from 'react';

const AdminResponseModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [adminResponse, setAdminResponse] = useState('');

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Respond to Reactivation Request</h2>
        <p className="mb-2 text-gray-600">Optionally add a message for the user (will be included in the email):</p>
        <textarea
          className="w-full border rounded p-2 mb-4 min-h-[80px]"
          value={adminResponse}
          onChange={e => setAdminResponse(e.target.value)}
          placeholder="Enter your message (optional)"
        />
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => onSubmit(adminResponse)}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminResponseModal;
