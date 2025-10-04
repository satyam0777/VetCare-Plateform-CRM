import React, { useState, useEffect } from 'react';
import { FaFileInvoiceDollar, FaCheckCircle, FaClock, FaExclamationTriangle, FaRupeeSign, FaCreditCard } from 'react-icons/fa';
import api from '../../utils/api';

const BillsPaymentsPanel = () => {
  const [bills, setBills] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [userStatus, setUserStatus] = useState({
    canBookAppointments: true,
    unpaidAmount: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [paymentModal, setPaymentModal] = useState(null);

  useEffect(() => {
    fetchUserBills();
    fetchPaymentStatus();
  }, []);

  const fetchUserBills = async () => {
    try {
      // Get pending consultations from user status
      const statusRes = await api.get('/payments/user/status');
      setUserStatus(statusRes.data);
      
      // Transform pending consultations into bills format
      const pendingBills = statusRes.data.pendingConsultations.map(consultation => ({
        id: consultation.appointmentId,
        doctorName: consultation.doctorName,
        petName: consultation.petName,
        amount: consultation.amount,
        dueDate: consultation.dueDate,
        consultationDate: consultation.consultationDate,
        status: consultation.status,
        type: 'consultation'
      }));
      
      setBills(pendingBills);
      
      // Get payment history
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?._id) {
        const historyRes = await api.get(`/payments/history/${user._id}`);
        setPaymentHistory(historyRes.data.payments || []);
      }
      
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStatus = async () => {
    try {
      const res = await api.get('/payments/user/status');
      setUserStatus(res.data);
    } catch (error) {
      console.error('Error fetching payment status:', error);
    }
  };

  const handlePayNow = async (bill) => {
    try {
      setLoading(true);
      
      // Create payment order for single consultation
      const orderRes = await api.post('/payments/create-order', {
        appointmentId: bill.id
      });
      
      if (orderRes.data.success) {
        // Initialize Razorpay payment
        const options = {
          key: orderRes.data.razorpayKeyId || 'rzp_test_key',
          amount: orderRes.data.amount,
          currency: orderRes.data.currency,
          name: 'VetCare Platform',
          description: `Payment for consultation with ${bill.doctorName}`,
          order_id: orderRes.data.orderId,
          prefill: {
            name: orderRes.data.patientDetails?.name || 'Patient',
            email: orderRes.data.patientDetails?.email || '',
            contact: orderRes.data.patientDetails?.phone || ''
          },
          theme: {
            color: '#10B981'
          },
          handler: async function (response) {
            try {
              // Verify payment
              const verifyRes = await api.post('/payments/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                appointmentId: bill.id
              });

              if (verifyRes.data.success) {
                alert('✅ Payment successful! You can now book new appointments.');
                fetchUserBills(); // Refresh the bills
                fetchPaymentStatus(); // Refresh status
              }
            } catch (error) {
              alert('❌ Payment verification failed. Please contact support.');
              console.error('Payment verification error:', error);
            }
          },
          modal: {
            ondismiss: function() {
              console.log('Payment modal closed');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      console.error('Error creating payment order:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // New function to pay all pending consultations at once
  const handlePayAllPending = async () => {
    try {
      setLoading(true);
      
      // Create payment order for all pending consultations
      const orderRes = await api.post('/payments/pay-pending-consultations');
      
      if (orderRes.data.success) {
        // Initialize Razorpay payment
        const options = {
          key: orderRes.data.razorpayKeyId || 'rzp_test_key',
          amount: orderRes.data.amount * 100, // Convert to paise
          currency: orderRes.data.currency,
          name: 'VetCare Platform',
          description: `Payment for ${orderRes.data.totalConsultations} pending consultations`,
          order_id: orderRes.data.orderId,
          prefill: {
            name: 'Patient',
            email: '',
            contact: ''
          },
          theme: {
            color: '#10B981'
          },
          handler: async function (response) {
            try {
              // Verify payment
              const verifyRes = await api.post('/payments/verify-pending-consultations', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });

              if (verifyRes.data.success) {
                alert(`✅ Payment successful! 
                
Total Paid: ₹${verifyRes.data.paymentDetails.totalPaid}
Platform Fee: ₹${verifyRes.data.paymentDetails.platformFee}
Doctor Earnings: ₹${verifyRes.data.paymentDetails.doctorsEarnings}
Consultations Paid: ${verifyRes.data.paymentDetails.consultationsPaid}

You can now book new appointments!`);
                
                fetchUserBills(); // Refresh the bills
                fetchPaymentStatus(); // Refresh status
              }
            } catch (error) {
              alert('❌ Payment verification failed. Please contact support.');
              console.error('Payment verification error:', error);
            }
          },
          modal: {
            ondismiss: function() {
              console.log('Payment modal closed');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      console.error('Error creating payment order for pending consultations:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to initiate payment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header with Status Alert */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FaFileInvoiceDollar className="text-3xl text-emerald-600" />
          <h1 className="text-3xl font-bold text-gray-800">Bills & Payments</h1>
        </div>

        {/* Payment Status Alert */}
        {!userStatus.canBookAppointments && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Payment Required</h3>
                <p className="text-red-700">
                  You have unpaid bills totaling <strong>{formatCurrency(userStatus.unpaidAmount)}</strong>. 
                  Please clear your dues to book new appointments.
                </p>
              </div>
            </div>
          </div>
        )}

        {userStatus.canBookAppointments && bills.length === 0 && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-lg">
            <div className="flex items-center">
              <FaCheckCircle className="text-green-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">All Paid Up!</h3>
                <p className="text-green-700">You have no pending bills. You can book new appointments anytime.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <FaClock className="inline mr-2" />
          Pending Bills ({bills.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <FaCheckCircle className="inline mr-2" />
          Payment History
        </button>
      </div>

      {/* Pending Bills Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {bills.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-4 border border-emerald-200">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">
                    Total Outstanding: <span className="text-emerald-600">{formatCurrency(bills.reduce((sum, bill) => sum + bill.amount, 0))}</span>
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {bills.length} pending consultation{bills.length > 1 ? 's' : ''} • 
                    Platform takes 18% • Doctors receive 82%
                  </p>
                </div>
                <button
                  onClick={handlePayAllPending}
                  disabled={loading}
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <FaCreditCard className="mr-2" />
                      Pay All Bills
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {bills.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
              <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Pending Bills</h3>
              <p className="text-gray-600">All your payments are up to date!</p>
            </div>
          ) : (
            bills.map((bill) => (
              <div key={bill.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Consultation with Dr. {bill.doctorName}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bill.status === 'overdue' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {bill.status === 'overdue' ? 'Overdue' : 'Pending'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Pet Name:</span> {bill.petName}
                      </div>
                      <div>
                        <span className="font-medium">Consultation Date:</span> {formatDate(bill.consultationDate)}
                      </div>
                      <div>
                        <span className="font-medium">Due Date:</span> {formatDate(bill.dueDate)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FaRupeeSign className="text-emerald-600" />
                        <span className="text-2xl font-bold text-emerald-600">
                          {formatCurrency(bill.amount)}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handlePayNow(bill)}
                        disabled={loading}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        <FaCreditCard />
                        {loading ? 'Processing...' : 'Pay Now'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Payment History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {paymentHistory.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
              <FaFileInvoiceDollar className="text-4xl text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Payment History</h3>
              <p className="text-gray-600">Your payment history will appear here once you make payments.</p>
            </div>
          ) : (
            paymentHistory.map((payment) => (
              <div key={payment.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Dr. {payment.doctor.name}
                      </h3>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Paid
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Pet:</span> {payment.petName}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {formatDate(payment.date)}
                      </div>
                      <div>
                        <span className="font-medium">Payment ID:</span> {payment.paymentId}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <FaRupeeSign className="text-green-600" />
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Summary Card */}
      <div className="mt-8 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-6 border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(userStatus.totalSpent || 0)}
            </div>
            <div className="text-sm text-gray-600">Total Spent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(userStatus.unpaidAmount)}
            </div>
            <div className="text-sm text-gray-600">Pending Amount</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${userStatus.canBookAppointments ? 'text-green-600' : 'text-red-600'}`}>
              {userStatus.canBookAppointments ? 'Active' : 'Restricted'}
            </div>
            <div className="text-sm text-gray-600">Account Status</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillsPaymentsPanel;