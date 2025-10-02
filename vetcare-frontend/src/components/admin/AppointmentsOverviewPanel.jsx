import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const AppointmentsOverviewPanel = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({
    status: '',
    date: '',
    doctor: ''
  });
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    // Fetch doctors list for filter dropdown
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/doctors');
        setDoctors(res.data);
      } catch (err) {
        console.error('Error fetching doctors:', err);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError('');
      try {
        // Build query parameters for filtering
        const params = new URLSearchParams();
        if (filter.status) params.append('status', filter.status);
        if (filter.date) params.append('date', filter.date);
        if (filter.doctor) params.append('doctor', filter.doctor);

        const queryString = params.toString();
        const url = queryString ? `/appointments?${queryString}` : '/appointments';
        
        console.log('Admin fetching all appointments with filter:', url);
        const res = await api.get(url);
        
        // Sort appointments by date and time
        const sortedAppointments = res.data.sort((a, b) => {
          if (a.date === b.date) {
            return a.time.localeCompare(b.time);
          }
          return new Date(b.date) - new Date(a.date); // Latest first
        });
        
        setAppointments(sortedAppointments);
        console.log(`✅ Admin loaded ${sortedAppointments.length} appointments`);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Failed to fetch appointments');
      }
      setLoading(false);
    };
    
    fetchAppointments();
  }, [filter]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }
    
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments(appts => appts.filter(appt => appt._id !== id));
      console.log(`✅ Admin cancelled appointment ${id}`);
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setError('Failed to cancel appointment');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await api.patch(`/appointments/${id}`, { status });
      setAppointments(appts => appts.map(appt => 
        appt._id === id ? { ...appt, status: res.data.status } : appt
      ));
      console.log(`✅ Admin updated appointment ${id} status to ${status}`);
    } catch (err) {
      console.error('Error updating appointment status:', err);
      setError('Failed to update appointment status');
    }
  };

  const clearFilters = () => {
    setFilter({ status: '', date: '', doctor: '' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAppointmentStats = () => {
    const total = appointments.length;
    const completed = appointments.filter(apt => apt.status === 'Completed').length;
    const pending = appointments.filter(apt => apt.status === 'Pending' || !apt.status).length;
    const confirmed = appointments.filter(apt => apt.status === 'Confirmed').length;
    const cancelled = appointments.filter(apt => apt.status === 'Cancelled').length;
    
    return { total, completed, pending, confirmed, cancelled };
  };

  const stats = getAppointmentStats();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-purple-600">📊</span>
              All Platform Appointments
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Complete overview of all appointments across the platform
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-center">
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-lg font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-blue-700">Total</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-2">
              <div className="text-lg font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-xs text-yellow-700">Pending</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-lg font-bold text-blue-600">{stats.confirmed}</div>
              <div className="text-xs text-blue-700">Confirmed</div>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <div className="text-lg font-bold text-green-600">{stats.completed}</div>
              <div className="text-xs text-green-700">Completed</div>
            </div>
            <div className="bg-red-50 rounded-lg p-2">
              <div className="text-lg font-bold text-red-600">{stats.cancelled}</div>
              <div className="text-xs text-red-700">Cancelled</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({...filter, status: e.target.value})}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={filter.date}
              onChange={(e) => setFilter({...filter, date: e.target.value})}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
            <select
              value={filter.doctor}
              onChange={(e) => setFilter({...filter, doctor: e.target.value})}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Doctors</option>
              {doctors.map(doctor => (
                <option key={doctor._id} value={doctor._id}>
                  Dr. {doctor.name} - {doctor.specialization}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-purple-600 font-medium">Loading appointments...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">❌</span>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📅</div>
                <h4 className="text-lg font-semibold text-gray-700 mb-2">No appointments found</h4>
                <p className="text-gray-500">
                  {Object.values(filter).some(v => v) 
                    ? 'Try adjusting your filters to see more results.'
                    : 'No appointments have been booked yet.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map(appt => (
                  <div key={appt._id} className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                      {/* Appointment Details */}
                      <div className="flex-1">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          {/* Patient Info */}
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 text-lg">🐾</span>
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-800">
                                {appt.user?.name || 'Patient'}
                              </h5>
                              <p className="text-sm text-gray-600">
                                Pet: <span className="font-medium">{appt.petName}</span>
                              </p>
                              {appt.user?.email && (
                                <p className="text-xs text-gray-500">{appt.user.email}</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Doctor Info */}
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-lg">👨‍⚕️</span>
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-800">
                                Dr. {appt.doctor?.name || 'Doctor'}
                              </h5>
                              <p className="text-sm text-gray-600">
                                {appt.doctor?.specialization || 'Veterinarian'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Appointment Details */}
                          <div className="flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-600">📅</span>
                                <span className="text-gray-700">{formatDate(appt.date)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-orange-600">⏰</span>
                                <span className="text-gray-700">{formatTime(appt.time)}</span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Reason:</span> {appt.reason}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appt.status || 'Pending')}`}>
                          {appt.status || 'Pending'}
                        </span>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusChange(appt._id, 'Confirmed')}
                            disabled={appt.status === 'Completed' || appt.status === 'Cancelled'}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => handleStatusChange(appt._id, 'Completed')}
                            disabled={appt.status === 'Completed' || appt.status === 'Cancelled'}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleCancel(appt._id)}
                            disabled={appt.status === 'Completed' || appt.status === 'Cancelled'}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentsOverviewPanel;
