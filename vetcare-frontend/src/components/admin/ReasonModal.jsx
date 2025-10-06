import React from 'react';

const ReasonModal = ({ isOpen, onClose, onSubmit, reason, setReason, actionType }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          {actionType === 'hard' ? 'Permanent Delete User' : 'Deactivate User'}
        </h2>
        <p className="mb-2 text-gray-600">
          Please provide a reason for {actionType === 'hard' ? 'permanent deletion' : 'deactivation'}:
        </p>
        <textarea
          className="w-full border rounded p-2 mb-4 min-h-[80px]"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Enter reason (required)"
        />
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={onSubmit}
            disabled={!reason || reason.trim().length < 3}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReasonModal;
