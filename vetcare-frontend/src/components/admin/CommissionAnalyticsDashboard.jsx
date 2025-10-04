import React, { useState, useEffect } from 'react';
import { 
  FiDollarSign, 
  FiTrendingUp, 
  FiCalendar, 
  FiUsers, 
  FiDownload,
  FiFilter,
  FiBarChart3,
  FiPieChart
} from 'react-icons/fi';

const CommissionAnalyticsDashboard = () => {

  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    platformCommission: 0,
    doctorEarnings: 0,
    totalConsultations: 0,
    avgConsultationFee: 0,
    monthlyData: [],
    topDoctors: [],
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('this_month');
  const [doctorFilter, setDoctorFilter] = useState('all');

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const api = (await import('../../utils/api')).default;
      const res = await api.get('/admin/revenue-analytics');
      const data = res.data;
      setAnalytics({
        totalRevenue: data.totalRevenue || 0,
        platformCommission: data.totalCommission || 0,
        doctorEarnings: data.totalDoctorEarnings || 0,
        totalConsultations: data.recentTransactions.length || 0,
        avgConsultationFee: data.totalRevenue && data.recentTransactions.length ? Math.round(data.totalRevenue / data.recentTransactions.length) : 0,
        monthlyData: [], // (Optional: implement monthly trend if needed)
        topDoctors: data.topDoctors || [],
        recentTransactions: data.recentTransactions || []
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const downloadReport = () => {
    // Generate CSV report
    const csvData = analytics.recentTransactions.map(transaction => ({
      Date: transaction.date,
      Doctor: transaction.doctor,
      'Consultation Fee': `₹${transaction.amount}`,
      'Platform Commission (15%)': `₹${transaction.commission}`,
      'Doctor Earnings (85%)': `₹${transaction.amount - transaction.commission}`,
      Type: transaction.type
    }));
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Doctor,Consultation Fee,Platform Commission (15%),Doctor Earnings (85%),Type\n"
      + csvData.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `commission_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Commission Analytics</h1>
          <p className="text-gray-600">Track platform revenue, doctor earnings, and commission structure</p>
        </div>
        <div className="flex space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
          <button
            onClick={downloadReport}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <FiDownload className="mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{analytics.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">↗ +12% from last month</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiDollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Platform Commission</p>
              <p className="text-2xl font-bold text-gray-900">₹{analytics.platformCommission.toLocaleString()}</p>
              <p className="text-xs text-blue-600 mt-1">15% commission rate</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FiTrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Doctor Earnings</p>
              <p className="text-2xl font-bold text-gray-900">₹{analytics.doctorEarnings.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">85% of total revenue</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <FiUsers className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Consultations</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalConsultations}</p>
              <p className="text-xs text-gray-600 mt-1">Avg: ₹{analytics.avgConsultationFee}/consultation</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FiCalendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue Trend</h3>
            <FiBarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {analytics.monthlyData.map((month, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{month.month}</span>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(month.revenue / Math.max(...analytics.monthlyData.map(m => m.revenue))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-20">₹{month.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Earning Doctors */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Earning Doctors</h3>
            <FiUsers className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {analytics.topDoctors.map((doctor, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{doctor.name}</p>
                    <p className="text-xs text-gray-600">{doctor.consultations} consultations • ⭐ {doctor.rating}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₹{doctor.earnings.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">Platform fee: ₹{Math.round(doctor.earnings * 0.15 / 0.85).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <div className="flex items-center space-x-2">
              <FiFilter className="h-4 w-4 text-gray-400" />
              <select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Doctors</option>
                <option value="top_earners">Top Earners</option>
                <option value="new_doctors">New Doctors</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consultation Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform Commission (15%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor Earnings (85%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.recentTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.doctor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{transaction.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    +₹{transaction.commission}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                    ₹{transaction.amount - transaction.commission}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {transaction.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commission Structure Info */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 p-2 rounded-full">
            <FiPieChart className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">VetCare Commission Structure</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-blue-800">Platform Commission: 15%</p>
                <p className="text-blue-700">Used for platform maintenance, customer support, and feature development</p>
              </div>
              <div>
                <p className="font-medium text-blue-800">Doctor Earnings: 85%</p>
                <p className="text-blue-700">Direct payment to doctors for their professional services</p>
              </div>
              <div>
                <p className="font-medium text-blue-800">Payment Processing</p>
                <p className="text-blue-700">Automatic monthly payouts to verified doctor accounts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionAnalyticsDashboard;