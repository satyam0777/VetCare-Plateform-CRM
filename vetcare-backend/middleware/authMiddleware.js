const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Flexible authentication that supports both JWT and doctor links
const flexibleAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const doctorLink = req.header('Doctor-Link') || req.query.doctorLink;
    
    // Try JWT authentication first
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          // Handle admin tokens
          if (decoded.id === 'admin' && decoded.role === 'admin') {
            req.user = 'admin';
            req.userRole = 'admin';
            req.userObj = {
              _id: 'admin',
              name: process.env.ADMIN_NAME || 'VetCare Administrator',
              email: process.env.ADMIN_EMAIL || 'admin@vetcare.com',
              role: 'admin'
            };
            return next();
          }
          
          // Handle regular user tokens
          const user = await User.findById(decoded.id);
          if (!user) {
            return res.status(401).json({ message: 'Invalid token. User not found.' });
          }
          
          req.user = user._id;
          req.userRole = user.role || 'user';
          req.userObj = user;
          return next();
        } catch (jwtError) {
          console.log('JWT verification failed, trying doctor link authentication...');
        }
      }
    }
    
    // Try doctor link authentication
    if (doctorLink) {
      const Doctor = require('../models/Doctor');
      const doctor = await Doctor.findOne({ 
        uniqueAccessLink: doctorLink,
        status: 'active'
      });
      
      if (!doctor) {
        return res.status(401).json({ message: 'Invalid doctor access link' });
      }
      
      req.user = doctor._id;
      req.userRole = 'doctor';
      req.userObj = doctor;
      req.isDoctor = true;
      return next();
    }
    
    // No valid authentication found
    return res.status(401).json({ message: 'Access denied. No valid authentication provided.' });
    
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({ message: 'Access denied. Invalid token format.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Accept both legacy and DB admin tokens
      if (
        (decoded.id === 'admin' && decoded.role === 'admin') ||
        (decoded.role === 'admin' && decoded.id && typeof decoded.id === 'string')
      ) {
        console.log(' Admin token verified (legacy or DB admin)');
        req.user = decoded.id;
        req.userRole = 'admin';
        req.userObj = {
          _id: decoded.id,
          name: process.env.ADMIN_NAME || 'VetCare Administrator',
          email: process.env.ADMIN_EMAIL || 'admin@vetcare.com',
          role: 'admin',
          isSystemAdmin: true,
          isActive: true
        };
        return next();
      }
      // Regular user token handling
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'Token is no longer valid.' });
      }
      // Check if user account is active
      if (!user.isActive) {
        return res.status(401).json({ message: 'Account has been deactivated.' });
      }
      req.user = decoded.id;
      req.userRole = user.role;
      req.userObj = user;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired.' });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token.' });
      } else {
        throw jwtError;
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication failed.' });
  }
};

//  NEW: Doctor Authentication via Unique Link
const doctorAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    // Try JWT token first (for regular authenticated doctors)
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.role === 'doctor') {
          req.user = decoded.id;
          req.userRole = 'doctor';
          req.userObj = user;
          return next();
        }
      } catch (jwtError) {
        // JWT failed, try doctor link authentication
      }
    }

    //  NEW: Doctor Link Authentication
    const doctorLink = req.header('Doctor-Link') || req.query.doctorLink || req.body.doctorLink;
    
    console.log(' Doctor authentication check:', {
      hasAuthHeader: !!authHeader,
      hasDoctorLink: !!doctorLink,
      doctorLink: doctorLink,
      headers: req.headers
    });
    
    if (doctorLink) {
      const Doctor = require('../models/Doctor');
      const doctor = await Doctor.findOne({ 
        uniqueAccessLink: doctorLink,
        status: 'active'
      });
      
      if (doctor) {
        req.user = doctor._id;
        req.userRole = 'doctor';
        req.userObj = doctor;
        req.isDoctorLink = true;
        console.log(` Doctor authenticated via link: ${doctor.name} (${doctor._id})`);
        return next();
      } else {
        console.log(` Doctor not found or inactive for link: ${doctorLink}`);
      }
    }

    return res.status(401).json({ 
      message: 'Access denied. Doctor authentication required.' 
    });

  } catch (error) {
    console.error('Doctor authentication error:', error);
    res.status(500).json({ message: 'Authentication failed.' });
  }
};

// Role-based access control middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }
    next();
  };
};

// Admin-only middleware
const adminOnly = authorize('admin', 'owner');

// Doctor-only middleware  
const doctorOnly = authorize('doctor');

// User-only middleware
const userOnly = authorize('user', 'farmer');

module.exports = { auth, authorize, adminOnly, doctorOnly, userOnly, doctorAuth, flexibleAuth };