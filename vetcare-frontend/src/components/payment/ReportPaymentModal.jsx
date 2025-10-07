import React, { useState } from 'react';

const ReportPaymentModal = ({ isOpen, onClose, report, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const API_URL = import.meta.env.VITE_API_URL || 'https://vetcare-plateform-crm.onrender.com/api';
  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // Create payment order
  const response = await fetch(`${API_URL}/payments/report/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reportId: report._id })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment order');
      }

      // Initialize Razorpay
      const options = {
        key: data.razorpayKeyId,
        amount: data.order.amount * 100, // Amount in paise
        currency: data.order.currency,
        name: 'VetCare Platform',
        description: `Payment for Medical Report - ${report.title}`,
        order_id: data.order.id,
        prefill: {
          name: JSON.parse(localStorage.getItem('user') || '{}').name || '',
          email: JSON.parse(localStorage.getItem('user') || '{}').email || '',
          contact: JSON.parse(localStorage.getItem('user') || '{}').mobile || ''
        },
        theme: {
          color: '#667eea'
        },
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await fetch(`${API_URL}/payments/report/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                reportId: report._id
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              onPaymentSuccess();
              onClose();
            } else {
              setError('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            setError('Payment verification failed');
          }
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setError('Payment gateway not available');
      }

    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            💳 Payment Required
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Report Details */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border border-blue-200">
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            📋 Medical Report Details
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Report Title:</span>
              <span className="font-medium text-gray-800">{report.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Animal:</span>
              <span className="font-medium text-gray-800">{report.animal?.name || 'Pet'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Doctor:</span>
              <span className="font-medium text-gray-800">{report.doctor?.name || 'Veterinarian'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium text-gray-800">
                {new Date(report.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-semibold text-green-700">Payment Breakdown</div>
            <div className="text-3xl">💰</div>
          </div>
          <div className="space-y-1 text-sm text-gray-700">
            <div className="flex justify-between"><span>Consultation Fee:</span> <span>₹{report.cost?.consultationFee || 0}</span></div>
            <div className="flex justify-between"><span>Platform Fee:</span> <span>₹{report.cost?.platformFee || 0}</span></div>
            <div className="flex justify-between"><span>Tax (5%):</span> <span>₹{report.cost?.tax || 0}</span></div>
            <div className="flex justify-between font-bold"><span>Total Amount:</span> <span>₹{report.cost?.total || 500}</span></div>
          </div>
        </div>

        {/* Info Message */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-yellow-600 text-xl">ℹ️</div>
            <div>
              <div className="text-sm font-medium text-yellow-800 mb-1">
                Why do I need to pay?
              </div>
              <div className="text-xs text-yellow-700">
                Payment ensures doctors are compensated for their professional consultation 
                and report generation. This helps maintain high-quality veterinary care.
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
            loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>💳</span>
              Pay ₹{report.cost?.total || 500} & Download Report
            </div>
          )}
        </button>

        {/* Security Note */}
        <div className="text-center mt-4">
          <div className="text-xs text-gray-500">
            🔒 Secure payment powered by Razorpay
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPaymentModal;