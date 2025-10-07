
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const AppointmentsPanel = ({ doctors }) => {
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({ doctor: '', petName: '', reason: '', date: '', time: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState({ canBookAppointments: true, pendingAmount: 0, hasPendingPayments: false });

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const userRole = localStorage.getItem('userRole');
        
        // Don't fetch appointments for admin users
        if (userRole === 'admin') {
          return;
        }
        
        const res = await api.get('/appointments');
        setAppointments(res.data);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Failed to fetch appointments');
      }
    };

    const fetchPaymentStatus = async () => {
      try {
        const userRole = localStorage.getItem('userRole');
        const token = localStorage.getItem('token');
        
        // Don't check payment status for admin users
        if (userRole === 'admin') {
          return;
        }
        
        // Check if user is authenticated
        if (!token) {
          console.log('No authentication token found');
          setPaymentStatus({ canBookAppointments: false, pendingAmount: 0, hasPendingPayments: false });
          return;
        }
        
        const res = await api.get('/payments/user/status');
        setPaymentStatus({
          canBookAppointments: res.data.canBookAppointments,
          pendingAmount: res.data.paymentStatus.unpaidAmount,
          hasPendingPayments: res.data.paymentStatus.hasPendingPayments
        });
      } catch (err) {
        console.error('Error fetching payment status:', err);
        if (err.response?.status === 401) {
          console.log('Authentication failed');
          setPaymentStatus({ canBookAppointments: false, pendingAmount: 0, hasPendingPayments: false });
        } else {
          // Default to allowing bookings if API fails for other reasons
          setPaymentStatus({ canBookAppointments: true, pendingAmount: 0, hasPendingPayments: false });
        }
      }
    };

    fetchAppointments();
    fetchPaymentStatus();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Check payment status first
      if (!paymentStatus.canBookAppointments) {
        setError(`Please clear your pending dues of ₹${paymentStatus.pendingAmount} before booking new appointments.`);
        setLoading(false);
        return;
      }

      // Get user ID from localStorage or context (assuming JWT payload)
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole');
      let userId = '';
      
      // Check if user is admin
      if (userRole === 'admin') {
        setError('Admin users cannot book appointments');
        setLoading(false);
        return;
      }
      
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.id;
          
          // Double check if userId is admin
          if (userId === 'admin') {
            setError('Admin users cannot book appointments');
            setLoading(false);
            return;
          }
        } catch {
          setError('Invalid authentication token');
          setLoading(false);
          return;
        }
      }
      
      const payload = {
        doctor: form.doctor,
        user: userId,
        petName: form.petName,
        reason: form.reason,
        date: form.date,
        time: form.time,
      };
      const res = await api.post('/appointments', payload);
  setSuccess('Appointment booked successfully! You will receive a confirmation email. If you do not see it in your inbox, please check your spam folder.');
      setAppointments([...appointments, res.data]);
      setForm({ doctor: '', petName: '', reason: '', date: '', time: '' });
    } catch (err) {
      console.error('Error booking appointment:', err);
      
      // Check if it's a payment restriction error
      if (err.response?.status === 402 && err.response?.data?.paymentRequired) {
        setError(err.response.data.message || `You have unpaid consultations. Please clear pending payments before booking new appointments.`);
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to book appointment');
      }
    }
    setLoading(false);
  };

  // Show only available doctors for booking
  const availableDoctors = doctors.filter((doc) => doc.isAvailable);

  // Check if user is admin - with debugging
  const userRole = localStorage.getItem('userRole');
  const token = localStorage.getItem('token');
  let isAdmin = false;
  
  // Debug what's in localStorage
  console.log('🔍 Debug - userRole from localStorage:', userRole);
  console.log('🔍 Debug - token exists:', !!token);
  
  // Check multiple ways if user is admin
  if (userRole === 'admin') {
    isAdmin = true;
  } else if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('🔍 Debug - JWT payload:', payload);
      if (payload.id === 'admin' || payload.role === 'admin') {
        isAdmin = true;
      }
    } catch (error) {
      console.log('🔍 Debug - Error parsing JWT:', error);
    }
  }
  
  console.log('🔍 Debug - Final isAdmin value:', isAdmin);

  // Temporary override for testing regular user functionality
  // Comment out this line when done testing
  // isAdmin = false;

  return (
    <div className="bg-white/20 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl p-4 sm:p-6">
      {/* Admin User Message */}
      {isAdmin && (
        <div className="bg-yellow-50/80 backdrop-blur-sm border border-yellow-200/50 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-3">
            <span className="text-yellow-600 text-2xl">ℹ️</span>
            <div>
              <h4 className="text-yellow-800 font-semibold">Admin Access Notice</h4>
              <p className="text-yellow-700 text-sm">Admin users cannot book personal appointments. Use the admin dashboard to manage platform appointments.</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Status Warning */}
      {!isAdmin && !paymentStatus.canBookAppointments && (
        <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-3">
            <span className="text-red-600 text-2xl">💳</span>
            <div className="flex-1">
              <h4 className="text-red-800 font-semibold">Payment Required</h4>
              <p className="text-red-700 text-sm mb-2">
                You have pending dues of <span className="font-bold">₹{paymentStatus.pendingAmount}</span>. 
                Please clear your previous payments before booking new appointments.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => window.location.href = '#reports'}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  💳 Pay Now
                </button>
                <button
                  onClick={() => window.location.href = '#bills'}
                  className="bg-white text-red-600 border border-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  📄 View Bills
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl shadow-lg">
            <span className="text-white text-lg sm:text-xl">📅</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            Book Appointment
          </h3>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center space-x-2 bg-white/30 backdrop-blur-sm border border-white/20 rounded-xl px-3 sm:px-4 py-2 text-gray-700 hover:bg-white/40 transition-all duration-300 text-sm sm:text-base"
        >
          <span>👥</span>
          <span className="font-medium">History</span>
        </button>
      </div>

      {/* Quick Stats - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-blue-200/30">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="text-blue-600 text-lg sm:text-xl">🩺</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-blue-600 font-medium truncate">Available Doctors</p>
              <p className="text-lg sm:text-xl font-bold text-blue-700">{availableDoctors.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-emerald-200/30">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="text-emerald-600 text-lg sm:text-xl">📅</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-emerald-600 font-medium truncate">Total Appointments</p>
              <p className="text-lg sm:text-xl font-bold text-emerald-700">{appointments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-purple-200/30">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="text-purple-600 text-lg sm:text-xl">✅</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-purple-600 font-medium truncate">Completed</p>
              <p className="text-lg sm:text-xl font-bold text-purple-700">{appointments.filter(a => a.status === 'completed').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      {!isAdmin && paymentStatus.canBookAppointments && (
        <form className="mb-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
              <span className="text-blue-600">👨‍⚕️</span>
              <span>Select Doctor</span>
            </label>
            <select 
              name="doctor" 
              value={form.doctor} 
              onChange={handleChange} 
              required 
              className="w-full bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            >
              <option value="">Choose your doctor</option>
              {availableDoctors.map((doc) => (
                <option key={doc._id} value={doc._id}>Dr. {doc.name} - {doc.specialization}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
              <span className="text-emerald-600">🐾</span>
              <span>Pet Name</span>
            </label>
            <input 
              type="text" 
              name="petName" 
              value={form.petName} 
              onChange={handleChange} 
              required 
              placeholder="Your pet's name"
              className="w-full bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300" 
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
            <span className="text-purple-600">🩺</span>
            <span>Reason for Visit</span>
          </label>
          <input 
            type="text" 
            name="reason" 
            value={form.reason} 
            onChange={handleChange} 
            required 
            placeholder="Brief description of the issue"
            className="w-full bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
              <span className="text-blue-600">📅</span>
              <span>Preferred Date</span>
            </label>
            <input 
              type="date" 
              name="date" 
              value={form.date} 
              onChange={handleChange} 
              required 
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" 
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
              <span className="text-emerald-600">🕒</span>
              <span>Preferred Time</span>
            </label>
            <input 
              type="time" 
              name="time" 
              value={form.time} 
              onChange={handleChange} 
              required 
              className="w-full bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300" 
            />
          </div>
        </div>

        <button 
          type="submit" 
          className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
            loading || availableDoctors.length === 0 || !paymentStatus.canBookAppointments
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
          }`}
          disabled={loading || availableDoctors.length === 0 || !paymentStatus.canBookAppointments}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Booking...</span>
            </div>
          ) : !paymentStatus.canBookAppointments ? (
            <div className="flex items-center justify-center space-x-2">
              <span>💳</span>
              <span>Clear Dues to Book (₹{paymentStatus.pendingAmount})</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>📅</span>
              <span>Book Appointment</span>
            </div>
          )}
        </button>

        {/* Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl">
            <div className="flex items-center space-x-2 text-red-700">
              <span>⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mt-4 p-4 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/50 rounded-xl">
            <div className="flex items-center space-x-2 text-emerald-700">
              <span>✅</span>
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}
        
        {availableDoctors.length === 0 && (
          <div className="mt-4 p-4 bg-yellow-50/80 backdrop-blur-sm border border-yellow-200/50 rounded-xl">
            <div className="flex items-center space-x-2 text-yellow-700">
              <span>⚠️</span>
              <span className="font-medium">No doctors available for booking at the moment.</span>
            </div>
          </div>
        )}

        {!paymentStatus.canBookAppointments && (
          <div className="mt-4 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl">
            <div className="flex items-center space-x-2 text-red-700">
              <span>💳</span>
              <span className="font-medium">Please clear your pending dues (₹{paymentStatus.pendingAmount}) to book new appointments.</span>
            </div>
          </div>
        )}
      </form>
      )}

      {/* Success Appointment Details */}
      {success && appointments.length > 0 && (
        <div className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50 backdrop-blur-lg rounded-2xl border border-emerald-200/50 shadow-lg">
          <h4 className="font-bold text-lg text-emerald-700 mb-4 flex items-center space-x-2">
            <span>✅</span>
            <span>Appointment Confirmed!</span>
          </h4>
          {(() => {
            const appt = appointments[appointments.length - 1];
            let doctorName = appt.doctor?.name || appt.doctor || '';
            if (doctorName && !doctorName.startsWith('Dr.')) {
              doctorName = 'Dr. ' + doctorName;
            }
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-600">📅</span>
                    <div>
                      <span className="text-sm text-gray-600">Date & Time</span>
                      <p className="font-semibold text-gray-800">{appt.date} at {appt.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-emerald-600">👨‍⚕️</span>
                    <div>
                      <span className="text-sm text-gray-600">Doctor</span>
                      <p className="font-semibold text-gray-800">{doctorName}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-pink-600">🐾</span>
                    <div>
                      <span className="text-sm text-gray-600">Pet Name</span>
                      <p className="font-semibold text-gray-800">{appt.petName || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-purple-600">🩺</span>
                    <div>
                      <span className="text-sm text-gray-600">Reason</span>
                      <p className="font-semibold text-gray-800">{appt.reason || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Appointment History */}
      {showHistory && appointments.length > 0 && (
        <div className="mt-6 p-6 bg-white/30 backdrop-blur-lg rounded-2xl border border-white/20">
          <h4 className="font-bold text-lg text-gray-700 mb-4 flex items-center space-x-2">
            <span className="text-blue-600">👥</span>
            <span>Appointment History</span>
          </h4>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {appointments.slice(-5).map((appt, index) => (
              <div key={index} className="p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-800">{appt.petName}</p>
                    <p className="text-sm text-gray-600">{appt.date} at {appt.time}</p>
                    <p className="text-sm text-gray-600">Dr. {appt.doctor?.name || appt.doctor}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    appt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    appt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {appt.status || 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPanel;
