import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const ReportsPanel = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // Get doctor ID from localStorage - check multiple possible sources
      const doctorData = JSON.parse(localStorage.getItem('doctor') || '{}');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Try to get doctor ID from multiple possible sources
      let doctorId = doctorData._id || doctorData.id || 
                     userData._id || userData.id || 
                     userInfo._id || userInfo.id;
      
      console.log('🔍 Available localStorage data:', {
        doctor: doctorData,
        userData: userData,
        user: userInfo,
        extractedDoctorId: doctorId
      });
      
      if (!doctorId) {
        console.error('❌ No doctor ID found in localStorage');
        setError('Doctor ID not found. Please login again.');
        setLoading(false);
        return;
      }
      
      // Validate that it's a valid MongoDB ObjectId format
      if (typeof doctorId !== 'string' || doctorId.length !== 24) {
        console.error('❌ Invalid doctor ID format:', doctorId);
        setError('Invalid doctor ID format. Please login again.');
        setLoading(false);
        return;
      }
      
      console.log(`🔍 Fetching reports for doctor ID: ${doctorId}`);
      const response = await api.get(`/reports/doctor/${doctorId}`);
      setReports(response.data);
      setLoading(false);
      
      console.log(`✅ Successfully loaded ${response.data.length} reports`);
    } catch (err) {
      console.error('Error fetching reports:', err);
      
      if (err.response?.status === 400) {
        setError('Invalid doctor ID. Please login again.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError('Failed to load reports. Please try again.');
      }
      setLoading(false);
    }
  };

  const downloadReport = async (reportId) => {
    try {
      const response = await api.get(`/reports/${reportId}/download`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading report:', err);
      setError('Failed to download report');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">📋 Medical Reports</h3>
          <p className="text-gray-600">View and manage consultation reports</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg">
          <span className="text-sm font-medium text-blue-700">
            Total Reports: {reports.length}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Reports Found</h3>
          <p className="text-gray-500">
            Completed consultation reports will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {report.title}
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      report.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Patient:</span> {report.farmer?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Pet:</span> {report.animal?.name || report.appointment?.petName || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Report Type:</span> {report.reportType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Date:</span> {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Diagnosis:</span> {report.diagnosis || 'Not specified'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Total Cost:</span> ₹{report.cost?.total || 0}
                      </p>
                    </div>
                  </div>

                  {report.diagnosis && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Diagnosis:</p>
                      <p className="text-sm text-gray-600">{report.diagnosis}</p>
                    </div>
                  )}

                  {report.recommendations && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-blue-700 mb-1">Recommendations:</p>
                      <p className="text-sm text-blue-600">{report.recommendations}</p>
                    </div>
                  )}

                  {report.prescriptions && report.prescriptions.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-700 mb-2">Prescriptions:</p>
                      <div className="space-y-1">
                        {report.prescriptions.map((prescription, index) => (
                          <p key={index} className="text-sm text-green-600">
                            • {prescription.medicineName} - {prescription.dosage} ({prescription.frequency})
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => downloadReport(report._id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    📄 Download PDF
                  </button>
                  
                  {report.appointment && (
                    <div className="text-xs text-gray-500 text-center">
                      Appointment: {new Date(report.appointment.date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsPanel;
