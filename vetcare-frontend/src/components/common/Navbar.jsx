import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import api from '../../utils/api';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authData, setAuthData] = useState({
    user: null,
    doctor: null,
    userRole: null,
    isLoading: true
  });
  const [routeDoctor, setRouteDoctor] = useState(null);

  // Memoize the authentication data loading to prevent unnecessary re-renders
  const loadAuthData = useMemo(() => {
    return () => {
      try {
        const userData = localStorage.getItem('user');
        const doctorData = localStorage.getItem('doctor');
        const userRole = localStorage.getItem('userRole');
        
        console.log('Raw localStorage data:', {
          userData: userData ? 'exists' : 'null',
          doctorData: doctorData ? 'exists' : 'null',
          userRole
        });

        const user = userData ? JSON.parse(userData) : null;
        const doctor = doctorData ? JSON.parse(doctorData) : null;

        console.log('📊 All Available Data:', {
          user: user ? { name: user.name, email: user.email, role: user.role } : null,
          doctor: doctor ? { name: doctor.name, email: doctor.email, _id: doctor._id } : null,
          userRole
        });

        // Don't clean up data - we need both for proper name resolution
        // Only clean if there's a clear conflict for the same person
        const isSamePerson = user && doctor && user.email === doctor.email;
        
        if (user && user.role === 'user' && doctor && !isSamePerson) {
          console.log('🧹 Clearing conflicting doctor data for different user');
          localStorage.removeItem('doctor');
          setAuthData({
            user,
            doctor: null,
            userRole,
            isLoading: false
          });
          return;
        }

        setAuthData({
          user,
          doctor,
          userRole,
          isLoading: false
        });

        console.log('Parsed auth data:', {
          user: user ? { name: user.name, email: user.email, role: user.role, _id: user._id } : null,
          doctor: doctor ? { name: doctor.name, _id: doctor._id } : null,
          userRole
        });
      } catch (error) {
        console.error('Error loading auth data:', error);
        setAuthData({
          user: null,
          doctor: null,
          userRole: null,
          isLoading: false
        });
      }
    };
  }, []);

  // Load authentication data on component mount only
  useEffect(() => {
    loadAuthData();
  }, [loadAuthData]);

  // Extract doctor link from URL when on doctor route
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath.startsWith('/doctor-dashboard/')) {
      const doctorLink = currentPath.split('/doctor-dashboard/')[1]?.split('/')[0];
      if (doctorLink && doctorLink !== 'dashboard') {
        console.log('🔍 Detected doctor link from URL:', doctorLink);
        
        // First try to find doctor data in localStorage by matching the link
        const storedDoctorData = localStorage.getItem('doctor');
        if (storedDoctorData) {
          try {
            const parsedDoctor = JSON.parse(storedDoctorData);
            if (parsedDoctor.uniqueAccessLink && parsedDoctor.uniqueAccessLink.includes(doctorLink)) {
              console.log('✅ Found matching doctor data in localStorage:', parsedDoctor.name);
              setRouteDoctor(parsedDoctor);
              return;
            }
          } catch (error) {
            console.error('Error parsing stored doctor data:', error);
          }
        }
        
        // If no local data found, fetch from backend
        console.log('🌐 Fetching doctor data from backend for link:', doctorLink);
        fetchDoctorByLink(doctorLink);
      }
    } else {
      setRouteDoctor(null);
    }
  }, [location.pathname]);

  // Function to fetch doctor data from backend using the unique link
  const fetchDoctorByLink = async (doctorLink) => {
    try {
      console.log('🌐 Making API request to:', `/doctor/verify-access/${doctorLink}`);
      const response = await api.get(`/doctor/verify-access/${doctorLink}`);
      
      if (response.data.valid && response.data.doctor) {
        console.log('✅ Successfully fetched doctor data from backend:', response.data.doctor.name);
        const doctorData = {
          _id: response.data.doctor.id,
          name: response.data.doctor.name,
          email: response.data.doctor.email,
          specialization: response.data.doctor.specialization,
          uniqueAccessLink: doctorLink,
          approved: response.data.doctor.approved,
          status: response.data.doctor.status
        };
        setRouteDoctor(doctorData);
        
        // Optionally store in localStorage for future use
        localStorage.setItem('doctor', JSON.stringify(doctorData));
        console.log('💾 Stored doctor data in localStorage for future use');
      } else {
        console.error('❌ Failed to verify doctor access:', response.data.error);
        setRouteDoctor(null);
      }
    } catch (error) {
      console.error('❌ Error fetching doctor data:', error.response?.data || error.message);
      setRouteDoctor(null);
    }
  };

  const { user, doctor, userRole } = authData;

  const handleLogout = () => {
    localStorage.clear();
    setAuthData({
      user: null,
      doctor: null,
      userRole: null,
      isLoading: false
    });
    navigate('/');
  };

  // Memoize role calculations to prevent unnecessary re-calculations
  const roleInfo = useMemo(() => {
    // Get current route information
    const currentPath = location.pathname;
    const isOnAdminRoute = currentPath.startsWith('/admin-dashboard');
    const isOnDoctorRoute = currentPath.startsWith('/doctor-dashboard');
    const isOnUserRoute = currentPath.startsWith('/dashboard') || currentPath.startsWith('/consultation') || currentPath.startsWith('/video-call');

    console.log('📍 Route Context:', { currentPath, isOnAdminRoute, isOnDoctorRoute, isOnUserRoute });

    // Use route-specific doctor data if available, otherwise fall back to stored doctor data
    const effectiveDoctor = routeDoctor || doctor;

    // Enhanced role detection with route context
    const isAdmin = Boolean(
      isOnAdminRoute || // If on admin route, prioritize admin
      userRole === 'admin' || 
      (user && user.role === 'admin') ||
      (user && user.email === 'adminvetcare@gmail.com')
    );
    
    // Doctor: prioritize route context, then stored data
    const isDoctor = Boolean(
      isOnDoctorRoute || // If on doctor route, prioritize doctor
      userRole === 'doctor' ||
      (user && user.role === 'doctor') || 
      (effectiveDoctor && effectiveDoctor._id && !isOnUserRoute) // Use effective doctor data
    );
    
    // User: prioritize route context, then stored data
    const isUser = Boolean(
      isOnUserRoute || // If on user route, prioritize user
      (user && 
       user._id && 
       (user.role === 'user' || user.role === 'farmer') &&
       !isOnAdminRoute && 
       !isOnDoctorRoute)
    );

    // Get current user/doctor name for display - enhanced role-specific logic
    let displayName = 'Guest';
    
    if (isAdmin) {
      // For admin: check if current user is admin, or use admin-specific data
      if (isOnAdminRoute && user && (user.role === 'admin' || user.email === 'adminvetcare@gmail.com')) {
        displayName = user.name || 'Admin';
      } else if (userRole === 'admin' && user) {
        displayName = user.name || 'Admin';
      } else {
        // If no admin user data, use default admin name
        displayName = 'Admin';
      }
    } else if (isDoctor) {
      // For doctor: prioritize route-specific doctor data, then other sources
      if (routeDoctor && routeDoctor.name) {
        displayName = routeDoctor.name;
        console.log('✅ Using route-specific doctor name:', displayName);
      } else if (effectiveDoctor && effectiveDoctor.name) {
        displayName = effectiveDoctor.name;
        console.log('✅ Using stored doctor name:', displayName);
      } else if (isOnDoctorRoute && user && user.role === 'doctor' && user.name) {
        displayName = user.name;
        console.log('✅ Using doctor user name:', displayName);
      } else if (userRole === 'doctor' && user && user.name) {
        displayName = user.name;
        console.log('✅ Using doctor role user name:', displayName);
      } else {
        displayName = 'Doctor';
        console.log('⚠️ Using fallback doctor name');
      }
    } else if (isUser) {
      // For user: use regular user data
      if (user && user.role === 'user' && user.name) {
        displayName = user.name;
      } else if (user && (user.role === 'farmer' || !user.role) && user.name) {
        displayName = user.name;
      } else {
        displayName = 'User';
      }
    }

    console.log('👤 Enhanced Name Resolution:', {
      currentRoute: currentPath,
      detectedRoles: { isAdmin, isDoctor, isUser },
      availableData: {
        user: user ? { name: user.name, role: user.role, email: user.email } : null,
        storedDoctor: doctor ? { name: doctor.name, email: doctor.email } : null,
        routeDoctor: routeDoctor ? { name: routeDoctor.name, link: routeDoctor.uniqueAccessLink } : null,
        userRole
      },
      finalDisplayName: displayName
    });

    return { isAdmin, isDoctor, isUser, displayName, effectiveDoctor };
  }, [user, doctor, userRole, location.pathname, routeDoctor]);

  const { isAdmin, isDoctor, isUser, displayName, effectiveDoctor } = roleInfo;

  // Only log when role actually changes to reduce console spam
  useEffect(() => {
    if (!authData.isLoading) {
      console.log('🔍 Navbar Role Update:', {
        currentRoute: location.pathname,
        roles: { isAdmin, isDoctor, isUser },
        displayName,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  }, [isAdmin, isDoctor, isUser, displayName, authData.isLoading, location.pathname]);

  // Show loading state briefly
  if (authData.isLoading) {
    return (
      <nav className="bg-gray-100 shadow-lg fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold text-gray-400">VetCare</div>
            <div className="text-gray-400">Loading...</div>
          </div>
        </div>
      </nav>
    );
  }

  // ADMIN Dashboard Navbar (Purple Theme) - Check first to avoid conflicts
  if (isAdmin) {
    console.log('🎯 Rendering ADMIN navbar for:', displayName);
    return (
      <nav className="bg-gradient-to-r from-purple-800 via-purple-900 to-pink-700 shadow-lg fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* VetCare Logo */}
            <div className="flex items-center">
              <Link to="/admin-dashboard" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-400 rounded-full flex items-center justify-center text-xl text-white">
                  👑
                </div>
                <span className="text-2xl font-bold text-white">VetCare</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                to="/" 
                className="text-white hover:text-purple-200 px-3 py-2 text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link 
                to="/admin-dashboard" 
                className="text-white hover:text-purple-200 px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-1"
              >
                <span>⚡</span>
                <span>Dashboard</span>
              </Link>
              <Link 
                to="/career-portal" 
                className="text-white hover:text-purple-200 px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-1"
              >
                <span>👥</span>
                <span>Manage</span>
              </Link>
            </div>

            {/* Admin Profile Section */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-white font-medium">
                  {displayName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-purple-200 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-purple-900/90 backdrop-blur-sm border-t border-purple-500/30">
                <Link to="/" className="flex text-white hover:text-purple-200 px-3 py-2 text-base font-medium">
                  Home
                </Link>
                <Link to="/admin-dashboard" className="flex text-white hover:text-purple-200 px-3 py-2 text-base font-medium items-center space-x-2">
                  <span>⚡</span><span>Dashboard</span>
                </Link>
                <Link to="/career-portal" className="flex text-white hover:text-purple-200 px-3 py-2 text-base font-medium items-center space-x-2">
                  <span>👥</span><span>Manage</span>
                </Link>
                <div className="border-t border-purple-500/30 pt-2">
                  <div className="px-3 py-2 text-white/90 text-sm">{displayName}</div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-base font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  }

  // DOCTOR Dashboard Navbar (Green Theme)
  if (isDoctor) {
    console.log('🎯 Rendering DOCTOR navbar for:', displayName);
    return (
      <nav className="bg-gradient-to-r from-green-800 via-emerald-900 to-teal-700 shadow-lg fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* VetCare Logo */}
            <div className="flex items-center">
              <Link to={`/doctor-dashboard/${effectiveDoctor?.uniqueAccessLink || 'dashboard'}`} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center text-xl text-white">
                  👨‍⚕️
                </div>
                <span className="text-2xl font-bold text-white">VetCare</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                to="/" 
                className="text-white hover:text-green-200 px-3 py-2 text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link 
                to={`/doctor-dashboard/${effectiveDoctor?.uniqueAccessLink || 'dashboard'}`}
                className="text-white hover:text-green-200 px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-1"
              >
                <span>🏥</span>
                <span>Dashboard</span>
              </Link>
              <Link 
                to={`/doctor-dashboard/${effectiveDoctor?.uniqueAccessLink || 'dashboard'}/reports`}
                className="text-white hover:text-green-200 px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-1"
              >
                <span>📋</span>
                <span>Reports</span>
              </Link>
            </div>

            {/* Doctor Profile Section */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-white font-medium">
                  Dr. {displayName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-green-200 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-green-900/90 backdrop-blur-sm border-t border-green-500/30">
                <Link to="/" className="flex text-white hover:text-green-200 px-3 py-2 text-base font-medium">
                  Home
                </Link>
                <Link to={`/doctor-dashboard/${effectiveDoctor?.uniqueAccessLink || 'dashboard'}`} className="flex text-white hover:text-green-200 px-3 py-2 text-base font-medium items-center space-x-2">
                  <span>🏥</span><span>Dashboard</span>
                </Link>
                <Link to={`/doctor-dashboard/${effectiveDoctor?.uniqueAccessLink || 'dashboard'}/reports`} className="flex text-white hover:text-green-200 px-3 py-2 text-base font-medium items-center space-x-2">
                  <span>📋</span><span>Reports</span>
                </Link>
                <div className="border-t border-green-500/30 pt-2">
                  <div className="px-3 py-2 text-white/90 text-sm">Dr. {displayName}</div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-base font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  }

  // User Dashboard Navbar (exactly matching your screenshot)
  if (isUser) {
    console.log('🎯 Rendering USER navbar for:', displayName);
    return (
      <nav className="bg-gradient-to-r from-blue-800 via-blue-900 to-teal-700 shadow-lg fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* VetCare Logo */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-xl text-white">
                  🩺
                </div>
                <span className="text-2xl font-bold text-white">VetCare</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                to="/" 
                className="text-white hover:text-blue-200 px-3 py-2 text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link 
                to="/dashboard" 
                className="text-white hover:text-blue-200 px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-1"
              >
                <span>📊</span>
                <span>Dashboard</span>
              </Link>
              <Link 
                to="/career-portal" 
                className="text-white hover:text-blue-200 px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-1"
              >
                <span>🔥</span>
                <span>Careers</span>
              </Link>
            </div>

            {/* User Profile Section */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-white font-medium">
                  Hello, {displayName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-blue-200 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-blue-900/90 backdrop-blur-sm border-t border-blue-500/30">
                <Link to="/" className="flex text-white hover:text-blue-200 px-3 py-2 text-base font-medium">
                  Home
                </Link>
                <Link to="/dashboard" className="flex text-white hover:text-blue-200 px-3 py-2 text-base font-medium items-center space-x-2">
                  <span>📊</span><span>Dashboard</span>
                </Link>
                <Link to="/career-portal" className="flex text-white hover:text-blue-200 px-3 py-2 text-base font-medium items-center space-x-2">
                  <span>🔥</span><span>Careers</span>
                </Link>
                <div className="border-t border-blue-500/30 pt-2">
                  <div className="px-3 py-2 text-white/90 text-sm">Hello, {displayName}</div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-base font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  }

  // Doctor Dashboard Navbar
  if (isDoctor) {
    return (
      <nav className="bg-gradient-to-r from-green-800 via-emerald-900 to-teal-700 shadow-lg fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* VetCare Logo */}
            <div className="flex items-center">
              <Link to={`/doctor-dashboard/${doctor.uniqueAccessLink || 'dashboard'}`} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center text-xl text-white">
                  👨‍⚕️
                </div>
                <span className="text-2xl font-bold text-white">VetCare</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                to="/" 
                className="text-white hover:text-green-200 px-3 py-2 text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link 
                to={`/doctor-dashboard/${doctor.uniqueAccessLink || 'dashboard'}`}
                className="text-white hover:text-green-200 px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-1"
              >
                <span>🏥</span>
                <span>Dashboard</span>
              </Link>
              <Link 
                to={`/doctor-dashboard/${doctor.uniqueAccessLink || 'dashboard'}/reports`}
                className="text-white hover:text-green-200 px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-1"
              >
                <span>📋</span>
                <span>Reports</span>
              </Link>
            </div>

            {/* Doctor Profile Section */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-white font-medium">
                  Dr. {displayName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-green-200 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-green-900/90 backdrop-blur-sm border-t border-green-500/30">
                <Link to="/" className="flex text-white hover:text-green-200 px-3 py-2 text-base font-medium">
                  Home
                </Link>
                <Link to={`/doctor-dashboard/${doctor.uniqueAccessLink || 'dashboard'}`} className="flex text-white hover:text-green-200 px-3 py-2 text-base font-medium items-center space-x-2">
                  <span>🏥</span><span>Dashboard</span>
                </Link>
                <Link to={`/doctor-dashboard/${doctor.uniqueAccessLink || 'dashboard'}/reports`} className="flex text-white hover:text-green-200 px-3 py-2 text-base font-medium items-center space-x-2">
                  <span>📋</span><span>Reports</span>
                </Link>
                <div className="border-t border-green-500/30 pt-2">
                  <div className="px-3 py-2 text-white/90 text-sm">Dr. {displayName}</div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-base font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  }

  // Admin Dashboard Navbar
  if (isAdmin) {
    return (
      <nav className="bg-gradient-to-r from-purple-800 via-purple-900 to-pink-700 shadow-lg fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* VetCare Logo */}
            <div className="flex items-center">
              <Link to="/admin-dashboard" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-400 rounded-full flex items-center justify-center text-xl text-white">
                  👑
                </div>
                <span className="text-2xl font-bold text-white">VetCare</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                to="/" 
                className="text-white hover:text-purple-200 px-3 py-2 text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link 
                to="/admin-dashboard" 
                className="text-white hover:text-purple-200 px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-1"
              >
                <span>⚡</span>
                <span>Dashboard</span>
              </Link>
              <Link 
                to="/career-portal" 
                className="text-white hover:text-purple-200 px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-1"
              >
                <span>👥</span>
                <span>Manage</span>
              </Link>
            </div>

            {/* Admin Profile Section */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-white font-medium">
                  {displayName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-purple-200 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-purple-900/90 backdrop-blur-sm border-t border-purple-500/30">
                <Link to="/" className="flex text-white hover:text-purple-200 px-3 py-2 text-base font-medium">
                  Home
                </Link>
                <Link to="/admin-dashboard" className="flex text-white hover:text-purple-200 px-3 py-2 text-base font-medium items-center space-x-2">
                  <span>⚡</span><span>Dashboard</span>
                </Link>
                <Link to="/career-portal" className="flex text-white hover:text-purple-200 px-3 py-2 text-base font-medium items-center space-x-2">
                  <span>👥</span><span>Manage</span>
                </Link>
                <div className="border-t border-purple-500/30 pt-2">
                  <div className="px-3 py-2 text-white/90 text-sm">{displayName}</div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-base font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  }

  // Landing page navbar for guests or when no valid role is detected
  console.log('🎯 Rendering GUEST navbar - no valid role detected');
  return (
    <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-blue-600">VetCare</Link>
          <div className="text-gray-600">
            {user || doctor ? `Welcome ${displayName}` : 'Welcome Guest'}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

