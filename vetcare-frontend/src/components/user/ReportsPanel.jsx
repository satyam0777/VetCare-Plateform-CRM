import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const ReportsPanel = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState({});
  const [pendingPayments, setPendingPayments] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('reports');

  useEffect(() => {
    fetchReports();
    fetchPaymentData();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/user');
      const reportsData = res.data.data || []; // Extract data from nested structure
      
      // Add dummy payment data to reports for testing
      const reportsWithPayment = reportsData.map(report => ({
        ...report,
        appointment: {
          ...report.appointment,
          payment: {
            totalAmount: Math.floor(Math.random() * 400) + 200, // Random amount between 200-600
            consultationFee: 200,
            medicineCharges: Math.floor(Math.random() * 200) + 30,
            status: Math.random() > 0.5 ? 'pending' : 'completed',
            _id: report._id + '_payment'
          }
        }
      }));
      
      setReports(reportsWithPayment);
      console.log(`✅ Loaded ${reportsWithPayment.length} reports with payment data`);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to fetch reports');
      
      // Add dummy reports for testing when API fails
      setReports([
        {
          _id: 'dummy_report_1',
          doctor: { name: 'Dr. Anupam' },
          appointment: {
            petName: 'buffalo',
            date: '2025-10-03',
            time: '15:02',
            payment: {
              totalAmount: 230,
              consultationFee: 200,
              medicineCharges: 30,
              status: 'pending'
            }
          },
          consultation: {
            diagnosis: 'High fever needs immediate attention'
          },
          prescription: {
            medicines: [
              { name: 'Paracetamol' },
              { name: 'Antibiotics' }
            ]
          },
          createdAt: '2025-10-03T08:30:00Z'
        },
        {
          _id: 'dummy_report_2',
          doctor: { name: 'Dr. Sharma' },
          appointment: {
            petName: 'Tommy',
            date: '2025-09-28',
            time: '10:30',
            payment: {
              totalAmount: 450,
              consultationFee: 300,
              medicineCharges: 150,
              status: 'completed'
            }
          },
          consultation: {
            diagnosis: 'Routine checkup completed successfully'
          },
          prescription: {
            medicines: [
              { name: 'Vitamins' }
            ]
          },
          createdAt: '2025-09-28T10:30:00Z'
        }
      ]);
    }
    setLoading(false);
  };

  const fetchPaymentData = async () => {
    setPaymentLoading(true);
    try {
      // Fetch pending payments
      const pendingRes = await api.get('/payments/pending');
      setPendingPayments(pendingRes.data.data || []);

      // Fetch payment history
      const historyRes = await api.get('/payments/history');
      setPaymentHistory(historyRes.data.data || []);
    } catch (err) {
      console.error('Error fetching payment data:', err);
      // Add dummy data for testing when API fails
      setPendingPayments([
        {
          _id: 'pending_1',
          totalAmount: 230,
          appointment: {
            petName: 'buffalo',
            date: '2025-10-03',
            doctor: { name: 'Anupam' }
          }
        },
        {
          _id: 'pending_2', 
          totalAmount: 450,
          appointment: {
            petName: 'Tommy',
            date: '2025-09-28',
            doctor: { name: 'Dr. Sharma' }
          }
        }
      ]);
      
      setPaymentHistory([
        {
          _id: 'paid_1',
          totalAmount: 350,
          paidAt: '2025-09-25',
          appointment: {
            petName: 'Fluffy',
            doctor: { name: 'Dr. Kumar' }
          }
        }
      ]);
    }
    setPaymentLoading(false);
  };

  const processPayment = async (paymentId, amount) => {
    try {
      const orderRes = await api.post('/payments/create-order', {
        amount: amount,
        currency: 'INR',
        receipt: `payment_${paymentId}`
      });

      const { order } = orderRes.data;

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_key',
        amount: order.amount,
        currency: order.currency,
        name: 'VetCare',
        description: 'Consultation Payment',
        order_id: order.id,
        handler: async function(response) {
          try {
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId: paymentId
            });

            if (verifyRes.data.success) {
              alert('Payment successful! You can now book new appointments.');
              fetchPaymentData(); // Refresh payment data
            }
          } catch (err) {
            console.error('Payment verification failed:', err);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: 'User',
          email: 'user@example.com'
        },
        theme: {
          color: '#059669'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Error creating payment order:', err);
      alert('Failed to create payment order. Please try again.');
    }
  };

  const downloadReport = async (reportId, petName, date) => {
    setDownloading(prev => ({ ...prev, [reportId]: true }));
    try {
      const response = await api.get(`/reports/${reportId}/download`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Create filename
      const formattedDate = new Date(date).toISOString().slice(0, 10);
      const filename = `${petName}_Medical_Report_${formattedDate}.pdf`;
      link.setAttribute('download', filename);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ Downloaded report for ${petName}`);
    } catch (err) {
      console.error('Error downloading report:', err);
      setError('Failed to download report');
    }
    setDownloading(prev => ({ ...prev, [reportId]: false }));
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    try {
      return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeStr;
    }
  };

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-emerald-600 font-medium">Loading reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
      {/* Header with Tabs */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-emerald-600">📋</span>
              Medical Reports & Payments
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              View reports and manage your bills
            </p>
          </div>
          <button
            onClick={() => {
              fetchReports();
              fetchPaymentData();
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'reports'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 Medical Reports
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'payments'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            💰 Bills & Payments
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">❌</span>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
            <button 
              onClick={() => setError('')}
              className="text-red-600 text-sm mt-2 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Reports Tab Content */}
        {activeTab === 'reports' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <span className="ml-3 text-emerald-600 font-medium">Loading reports...</span>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📋</div>
                <h4 className="text-lg font-semibold text-gray-700 mb-2">
                  No Medical Reports Found
                </h4>
                <p className="text-gray-500">
                  Your pet's medical reports will appear here after completed consultations.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map(report => (
                  <div key={report._id} className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Report Details */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-emerald-600 text-lg">🏥</span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div>
                                <h5 className="font-semibold text-gray-800 text-lg">
                                  {report.appointment?.petName || 'Pet Medical Report'}
                                </h5>
                                <p className="text-sm text-gray-600">
                                  Dr. {report.doctor?.name || 'Unknown Doctor'}
                                </p>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                                  Report #{report._id.slice(-6).toUpperCase()}
                                </span>
                                {report.appointment?.payment?.status === 'pending' && (
                                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                    Payment Pending
                                  </span>
                                )}
                                {report.appointment?.payment?.status === 'completed' && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    Paid
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-blue-600">📅</span>
                                <span className="text-gray-700">{formatDate(report.appointment?.date || report.createdAt)}</span>
                              </div>
                              {report.appointment?.time && (
                                <div className="flex items-center gap-2">
                                  <span className="text-purple-600">⏰</span>
                                  <span className="text-gray-700">{formatTime(report.appointment.time)}</span>
                                </div>
                              )}
                            </div>

                            {/* Report Summary */}
                            <div className="mt-4 space-y-2">
                              {report.consultation?.diagnosis && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Diagnosis:</p>
                                  <p className="text-sm text-gray-600">{report.consultation.diagnosis}</p>
                                </div>
                              )}
                              
                              {report.prescription?.medicines?.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Prescribed Medicines:</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {report.prescription.medicines.slice(0, 3).map((med, index) => (
                                      <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                        {med.name}
                                      </span>
                                    ))}
                                    {report.prescription.medicines.length > 3 && (
                                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        +{report.prescription.medicines.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Payment Information */}
                              {report.appointment?.payment && (
                                <div className="bg-gray-50 rounded-lg p-3 mt-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-gray-700">Bill Amount:</p>
                                      <p className="text-lg font-bold text-gray-800">₹{report.appointment.payment.totalAmount}</p>
                                      {report.appointment.payment.consultationFee > 0 && (
                                        <p className="text-xs text-gray-600">
                                          Consultation: ₹{report.appointment.payment.consultationFee}
                                          {report.appointment.payment.medicineCharges > 0 && `, Medicine: ₹${report.appointment.payment.medicineCharges}`}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      {report.appointment.payment.status === 'pending' && (
                                        <button
                                          onClick={() => processPayment(report.appointment._id, report.appointment.payment.totalAmount)}
                                          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                                        >
                                          Pay Now
                                        </button>
                                      )}
                                      {report.appointment.payment.status === 'completed' && (
                                        <span className="text-green-600 font-medium text-sm">✅ Paid</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => downloadReport(report._id, report.appointment?.petName || 'Pet', report.appointment?.date || report.createdAt)}
                          disabled={downloading[report._id]}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          {downloading[report._id] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Downloading...
                            </>
                          ) : (
                            <>
                              📥 Download PDF
                            </>
                          )}
                        </button>
                        
                        <div className="text-xs text-gray-500 self-center">
                          Generated: {new Date(report.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Payments Tab Content */}
        {activeTab === 'payments' && (
          <>
            {paymentLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <span className="ml-3 text-emerald-600 font-medium">Loading payment data...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Pending Payments */}
                {pendingPayments.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                      <span>⚠️</span>
                      Pending Payments ({pendingPayments.length})
                    </h4>
                    <div className="space-y-3">
                      {pendingPayments.map(payment => (
                        <div key={payment._id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <h5 className="font-semibold text-gray-800">
                                {payment.appointment?.petName} - Dr. {payment.appointment?.doctor?.name}
                              </h5>
                              <p className="text-sm text-gray-600">
                                Date: {formatDate(payment.appointment?.date)}
                              </p>
                              <p className="text-lg font-bold text-red-600 mt-1">
                                Amount Due: ₹{payment.totalAmount}
                              </p>
                            </div>
                            <button
                              onClick={() => processPayment(payment._id, payment.totalAmount)}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              Pay Now
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <span className="font-medium">⚠️ Important:</span> You cannot book new appointments until all pending payments are cleared.
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment History */}
                <div>
                  <h4 className="text-lg font-semibold text-green-600 mb-4 flex items-center gap-2">
                    <span>💳</span>
                    Payment History
                  </h4>
                  {paymentHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-4">💳</div>
                      <p>No payment history found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paymentHistory.map(payment => (
                        <div key={payment._id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <h5 className="font-semibold text-gray-800">
                                {payment.appointment?.petName} - Dr. {payment.appointment?.doctor?.name}
                              </h5>
                              <p className="text-sm text-gray-600">
                                Paid on: {new Date(payment.paidAt || payment.updatedAt).toLocaleDateString()}
                              </p>
                              <p className="text-lg font-bold text-green-600 mt-1">
                                Paid: ₹{payment.totalAmount}
                              </p>
                            </div>
                            <span className="text-green-600 font-medium">✅ Completed</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsPanel;