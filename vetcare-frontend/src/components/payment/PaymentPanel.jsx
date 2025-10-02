import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentPanel = ({ appointmentId, amount, onPaymentSuccess, onPaymentError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initiatePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create payment order
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          appointmentId,
          amount: amount * 100, // Convert to paise
          currency: 'INR'
        })
      });

      const orderData = await response.json();

      if (!response.ok) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Initialize Razorpay payment
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'VetCare - Professional Veterinary Services',
        description: `Payment for Appointment #${appointmentId.slice(-8)}`,
        order_id: orderData.id,
        image: '/logo192.png',
        handler: async function (response) {
          await handlePaymentSuccess(response, orderData);
        },
        prefill: {
          name: orderData.patientDetails.name,
          email: orderData.patientDetails.email,
          contact: orderData.patientDetails.phone
        },
        notes: {
          appointment_id: appointmentId,
          patient_name: orderData.patientDetails.name,
          doctor_name: orderData.doctorDetails.name,
          pet_name: orderData.appointmentDetails.petName
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
            setError('Payment was cancelled by user');
          }
        },
        retry: {
          enabled: true,
          max_count: 3
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        setError(`Payment failed: ${response.error.description}`);
        setIsLoading(false);
        
        if (onPaymentError) {
          onPaymentError(response.error);
        }
      });

      rzp.open();

    } catch (err) {
      console.error('❌ Error initiating payment:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentResponse, orderData) => {
    try {
      setIsLoading(true);
      
      // Verify payment on backend
      const verificationResponse = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          appointmentId
        })
      });

      const verificationData = await verificationResponse.json();

      if (!verificationResponse.ok) {
        throw new Error(verificationData.error || 'Payment verification failed');
      }

      // Set payment details for success display
      setPaymentDetails({
        paymentId: paymentResponse.razorpay_payment_id,
        orderId: paymentResponse.razorpay_order_id,
        amount: orderData.amount / 100,
        status: 'success',
        timestamp: new Date().toISOString(),
        appointmentDetails: orderData.appointmentDetails,
        doctorDetails: orderData.doctorDetails
      });

      // Call success callback
      if (onPaymentSuccess) {
        onPaymentSuccess(verificationData);
      }

      setIsLoading(false);

    } catch (err) {
      console.error('❌ Error verifying payment:', err);
      setError(`Payment verification failed: ${err.message}`);
      setIsLoading(false);
      
      if (onPaymentError) {
        onPaymentError({ description: err.message });
      }
    }
  };

  const handleRetryPayment = () => {
    setError(null);
    setPaymentDetails(null);
    initiatePayment();
  };

  // Success view
  if (paymentDetails && paymentDetails.status === 'success') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-2xl p-6">
        <div className="text-center">
          <div className="text-6xl text-green-500 mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">Your appointment has been confirmed</p>
          
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-semibold text-green-600">₹{paymentDetails.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment ID:</span>
                <span className="font-mono text-xs">{paymentDetails.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Doctor:</span>
                <span className="font-medium">{paymentDetails.doctorDetails.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pet:</span>
                <span className="font-medium">{paymentDetails.appointmentDetails.petName}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => window.print()}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error view
  if (error) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-2xl p-6">
        <div className="text-center">
          <div className="text-6xl text-red-500 mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={handleRetryPayment}
              disabled={isLoading}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Retry Payment'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main payment view
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
        <h2 className="text-2xl font-bold mb-2">Complete Payment</h2>
        <p className="text-blue-100">Secure payment for your appointment</p>
      </div>

      <div className="p-6">
        {/* Payment Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Consultation Fee:</span>
              <span className="font-medium">₹{amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Fee:</span>
              <span className="font-medium">₹{Math.round(amount * 0.15)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">GST (18%):</span>
              <span className="font-medium">₹{Math.round((amount + amount * 0.15) * 0.18)}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount:</span>
              <span className="text-blue-600">₹{Math.round((amount + amount * 0.15) * 1.18)}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
          <div className="space-y-2">
            <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="razorpay"
                checked={paymentMethod === 'razorpay'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="text-blue-600 mr-3"
              />
              <div className="flex-1">
                <div className="font-medium">Razorpay</div>
                <div className="text-sm text-gray-500">Cards, UPI, Net Banking, Wallets</div>
              </div>
              <div className="flex space-x-1">
                <img src="/visa-logo.png" alt="Visa" className="h-6 w-auto" onError={(e) => e.target.style.display = 'none'} />
                <img src="/mastercard-logo.png" alt="Mastercard" className="h-6 w-auto" onError={(e) => e.target.style.display = 'none'} />
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">UPI</span>
              </div>
            </label>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="text-green-500 text-xl mr-3">🔒</div>
            <div>
              <h4 className="font-medium text-green-800 mb-1">Secure Payment</h4>
              <p className="text-sm text-green-700">
                Your payment information is encrypted and secure. We never store your card details.
              </p>
            </div>
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={initiatePayment}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            `Pay ₹${Math.round((amount + amount * 0.15) * 1.18)} Securely`
          )}
        </button>

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center mt-4">
          By proceeding, you agree to our{' '}
          <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default PaymentPanel;