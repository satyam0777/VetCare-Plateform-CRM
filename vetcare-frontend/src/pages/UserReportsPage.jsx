import React from 'react';
import { useNavigate } from 'react-router-dom';
import ReportsPanel from '../components/user/ReportsPanel';

const UserReportsPage = () => {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 relative z-10" style={{ marginTop: '100px' }}>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              ←
            </button>
            <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-2xl text-white">
              📄
            </div>
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                <span className="text-teal-600">Medical</span> <span className="text-blue-600">Reports</span>
              </h2>
              <p className="text-gray-600">View and download your pet's medical reports</p>
            </div>
          </div>
        </div>

        {/* Reports Panel */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-white/30">
          <ReportsPanel />
        </div>
      </div>
    </section>
  );
};

export default UserReportsPage;