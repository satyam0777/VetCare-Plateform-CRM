import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const AnalyticsPanel = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/admin/analytics');
        setStats(res.data);
      } catch (err) {
        setError('Failed to fetch analytics');
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-xl font-bold mb-2">Analytics</h3>
      {loading && <div className="text-blue-600">Loading analytics...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-100 p-2 rounded">
            <span className="font-semibold">Total Users:</span> {stats.totalUsers}
          </div>
          <div className="bg-gray-100 p-2 rounded">
            <span className="font-semibold">Total Doctors:</span> {stats.totalDoctors}
          </div>
          <div className="bg-gray-100 p-2 rounded">
            <span className="font-semibold">Total Appointments:</span> {stats.totalAppointments}
          </div>
          <div className="bg-green-100 p-2 rounded">
            <span className="font-semibold">Total Revenue:</span> ₹{stats.totalRevenue || 0}
          </div>
          <div className="bg-blue-100 p-2 rounded">
            <span className="font-semibold">Platform Commission:</span> ₹{stats.totalCommission || 0}
          </div>
          <div className="bg-emerald-100 p-2 rounded">
            <span className="font-semibold">Doctor Earnings:</span> ₹{stats.totalDoctorEarnings || 0}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPanel;
