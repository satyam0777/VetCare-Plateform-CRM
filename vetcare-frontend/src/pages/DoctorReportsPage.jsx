import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReportsPanel from '../components/doctor/ReportsPanel';

const DoctorReportsPage = () => {
  const navigate = useNavigate();
  const { link } = useParams();

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50 relative z-10" style={{ marginTop: '100px' }}>
      <div className="p-4 md:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => navigate(`/doctor-dashboard/${link}`)}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              ←
            </button>
            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-2xl text-white">
              📊
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gray-900">
                <span className="text-orange-600">Reports</span> <span className="text-emerald-600">&amp; Analytics</span>
              </h2>
              <p className="text-gray-600">Track your practice performance and patient reports</p>
            </div>
          </div>
        </div>

        {/* Reports Panel */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-8 border border-white/30">
          <ReportsPanel doctorLink={link} />
        </div>
      </div>
    </section>
  );
};

export default DoctorReportsPage;