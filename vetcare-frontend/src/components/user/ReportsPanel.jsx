import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const ReportsPanel = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState({});

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/user');
      const reportsData = res.data.data || []; // Extract data from nested structure
      setReports(reportsData);
      console.log(`✅ Loaded ${reportsData.length} reports`);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to fetch reports');
    }
    setLoading(false);
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
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-emerald-600">📋</span>
              Medical Reports
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Download and view your pet's medical reports
            </p>
          </div>
          <button
            onClick={fetchReports}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            🔄 Refresh
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

        {reports.length === 0 ? (
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
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                            Report #{report._id.slice(-6).toUpperCase()}
                          </span>
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

                          {report.payment?.totalAmount > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-green-600">💰</span>
                              <span className="text-sm text-green-600 font-medium">
                                Total Paid: ₹{report.payment.totalAmount}
                              </span>
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
      </div>
    </div>
  );
};

export default ReportsPanel;