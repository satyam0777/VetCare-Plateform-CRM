import React, { useState, useEffect } from 'react';
import PaymentPanel from '../payment/PaymentPanel';

const ConsultationPaymentModal = ({ appointment, isOpen, onClose, onPaymentSuccess }) => {
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && appointment?.status === 'report_ready') {
      setShowPayment(true);
    }
  }, [isOpen, appointment]);

  const handlePaymentSuccess = (paymentData) => {
    console.log('Payment successful:', paymentData);
    setShowPayment(false);
    onPaymentSuccess && onPaymentSuccess(paymentData);
    
    // Auto close modal after success
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    // Keep modal open for retry
  };

  if (!isOpen || !appointment) return null;

  // Check if payment is already completed
  if (appointment.payment?.status === 'completed') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl text-green-500 mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Already Completed</h2>
            <p className="text-gray-600 mb-4">
              Your payment for this consultation has already been processed.
            </p>
            <button
              onClick={onClose}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if report is not ready yet
  if (appointment.status !== 'report_ready') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl text-blue-500 mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Consultation In Progress</h2>
            <p className="text-gray-600 mb-4">
              Dr. {appointment.doctor?.name} is still working on your consultation report. 
              Payment will be available once the consultation is completed.
            </p>
            <div className="text-sm text-gray-500 mb-4">
              Current Status: <span className="font-medium capitalize">{appointment.status?.replace('_', ' ')}</span>
            </div>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Consultation Completed!</h2>
              <p className="text-blue-100">Dr. {appointment.doctor?.name} has completed your consultation</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Consultation Summary */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Consultation Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Pet Name</div>
              <div className="font-medium">{appointment.petName}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Doctor</div>
              <div className="font-medium">Dr. {appointment.doctor?.name}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Date & Time</div>
              <div className="font-medium">{appointment.date} at {appointment.time}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Consultation Fee</div>
              <div className="font-medium text-green-600">₹{appointment.payment?.consultationFee || 500}</div>
            </div>
          </div>

          {/* Report Status */}
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-green-500 text-xl mr-3">✅</div>
              <div>
                <div className="font-medium text-green-800">Medical Report Ready</div>
                <div className="text-sm text-green-600">
                  Your consultation report and prescription are ready. Complete the payment to access them.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="p-6">
          {showPayment ? (
            <PaymentPanel
              appointmentId={appointment._id}
              amount={appointment.payment?.totalAmount || appointment.payment?.consultationFee + (appointment.payment?.consultationFee * 0.15) || 575}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          ) : (
            <div className="text-center">
              <div className="text-4xl text-blue-500 mb-4">💳</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ready for Payment</h3>
              <p className="text-gray-600 mb-6">
                Complete your payment to access the full consultation report and prescription.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="text-sm text-blue-600 mb-2">What you'll get after payment:</div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✅ Complete medical report</li>
                  <li>✅ Detailed prescription</li>
                  <li>✅ Treatment recommendations</li>
                  <li>✅ Follow-up instructions</li>
                </ul>
              </div>

              <button
                onClick={() => setShowPayment(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-semibold"
              >
                Proceed to Payment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultationPaymentModal;