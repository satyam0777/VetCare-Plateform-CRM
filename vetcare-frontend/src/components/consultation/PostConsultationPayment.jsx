import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PaymentPanel from '../payment/PaymentPanel';

const PostConsultationPayment = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    checkPaymentDue();
  }, [appointmentId]);

  const checkPaymentDue = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/consultation/payment-due/${appointmentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check payment status');
      }

      if (!data.paymentDue) {
        // No payment required, redirect to dashboard
        navigate('/dashboard', { 
          state: { 
            message: 'No payment required for this appointment',
            type: 'info'
          }
        });
        return;
      }

      setPaymentData(data);
      setLoading(false);

    } catch (err) {
      console.error(' Error checking payment:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleInitiatePayment = () => {
    setShowPayment(true);
  };

  const handlePaymentSuccess = (paymentResult) => {
    console.log(' Payment successful:', paymentResult);
    
    // Show success message and redirect
    navigate('/dashboard', {
      state: {
        message: `Payment successful! Medical report for ${paymentData.appointment.petName} is now available.`,
        type: 'success',
        paymentId: paymentResult.paymentId
      }
    });
  };

  const handlePaymentError = (error) => {
    console.error(' Payment failed:', error);
    setError(`Payment failed: ${error.description || 'Unknown error'}`);
    setShowPayment(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Checking Payment Status</h3>
            <p className="text-gray-600">Please wait while we verify your appointment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <PaymentPanel
          appointmentId={appointmentId}
          amount={paymentData.payment.totalAmount}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6">
          <div className="flex items-center">
            <div className="text-4xl mr-4">✅</div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Consultation Completed!</h1>
              <p className="text-green-100">Your medical consultation is ready for payment</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Consultation Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Consultation Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Pet Name</label>
                <p className="text-lg font-semibold text-gray-900">{paymentData.appointment.petName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Veterinarian</label>
                <p className="text-lg font-semibold text-gray-900">
                  Dr. {paymentData.appointment.doctorName}
                </p>
                <p className="text-sm text-gray-600">{paymentData.appointment.doctorSpecialization}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Date & Time</label>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(paymentData.appointment.consultationDate).toLocaleDateString()} at {paymentData.appointment.consultationTime}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Patient</label>
                <p className="text-lg font-semibold text-gray-900">{paymentData.patient.name}</p>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Consultation Fee:</span>
                <span className="font-medium">₹{paymentData.payment.consultationFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (15%):</span>
                <span className="font-medium">₹{paymentData.payment.platformFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST (18%):</span>
                <span className="font-medium">₹{paymentData.payment.tax}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-xl font-bold">
                <span>Total Amount:</span>
                <span className="text-blue-600">₹{paymentData.payment.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="text-yellow-500 text-2xl mr-3">⚠️</div>
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Payment Required</h4>
                <p className="text-sm text-yellow-700">
                  Please complete the payment to access your medical report and consultation notes. 
                  Payment must be completed by{' '}
                  <strong>{new Date(paymentData.payment.dueDate).toLocaleDateString()}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleInitiatePayment}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 px-6 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 font-semibold text-lg"
            >
              Proceed to Payment ₹{paymentData.payment.totalAmount}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Pay Later
            </button>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center text-green-600 mb-2">
              <div className="text-xl mr-2">🔒</div>
              <span className="text-sm font-medium">Secure Payment</span>
            </div>
            <p className="text-xs text-gray-500">
              Your payment is secured by Razorpay with 256-bit SSL encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostConsultationPayment;