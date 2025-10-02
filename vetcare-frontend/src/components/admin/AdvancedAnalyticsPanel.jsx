// Advanced Analytics Component
import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdvancedAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    revenue: [],
    appointments: [],
    userGrowth: [],
    doctorPerformance: []
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30'); // days

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin-new/analytics?period=${timeframe}`);
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Revenue Chart Data
  const revenueChartData = {
    labels: analyticsData.revenue.map(item => item.date),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: analyticsData.revenue.map(item => item.amount),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Appointments Chart Data
  const appointmentsChartData = {
    labels: ['Completed', 'Pending', 'Cancelled', 'Rescheduled'],
    datasets: [
      {
        data: [
          analyticsData.appointments.completed || 0,
          analyticsData.appointments.pending || 0,
          analyticsData.appointments.cancelled || 0,
          analyticsData.appointments.rescheduled || 0
        ],
        backgroundColor: [
          '#22c55e', // Green for completed
          '#f59e0b', // Yellow for pending
          '#ef4444', // Red for cancelled
          '#3b82f6'  // Blue for rescheduled
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  // User Growth Chart Data
  const userGrowthData = {
    labels: analyticsData.userGrowth.map(item => item.date),
    datasets: [
      {
        label: 'New Users',
        data: analyticsData.userGrowth.map(item => item.newUsers),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      },
      {
        label: 'Active Users',
        data: analyticsData.userGrowth.map(item => item.activeUsers),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1
      }
    ]
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">📊 Advanced Analytics</h2>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-green-800">
                  ₹{analyticsData.revenue.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Appointments</p>
                <p className="text-2xl font-bold text-blue-800">
                  {Object.values(analyticsData.appointments).reduce((sum, val) => sum + (val || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Active Users</p>
                <p className="text-2xl font-bold text-purple-800">
                  {analyticsData.userGrowth[analyticsData.userGrowth.length - 1]?.activeUsers || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Success Rate</p>
                <p className="text-2xl font-bold text-orange-800">
                  {Math.round((analyticsData.appointments.completed / 
                    Object.values(analyticsData.appointments).reduce((sum, val) => sum + (val || 0), 0)) * 100) || 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">🎯</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💹 Revenue Trend</h3>
          <div className="h-64">
            <Line 
              data={revenueChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return '₹' + value.toLocaleString();
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Appointment Status */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Appointment Status</h3>
          <div className="h-64">
            <Doughnut 
              data={appointmentsChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      padding: 20
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* User Growth */}
        <div className="bg-white rounded-2xl shadow-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 User Growth</h3>
          <div className="h-64">
            <Bar 
              data={userGrowthData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Top Performing Doctors */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Performing Doctors</h3>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Doctor</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Specialization</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Appointments</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Rating</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.doctorPerformance.slice(0, 5).map((doctor, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm">👨‍⚕️</span>
                      </div>
                      <span className="font-medium">{doctor.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{doctor.specialization}</td>
                  <td className="py-3 px-4">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                      {doctor.appointmentCount}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <span className="text-yellow-500 mr-1">⭐</span>
                      <span className="font-medium">{doctor.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-green-600">
                    ₹{doctor.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;