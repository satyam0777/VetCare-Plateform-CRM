const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
      
      // ✅ Handle admin tokens (system admin doesn't exist in database)
      if (decoded.id === 'admin' && decoded.role === 'admin') {
        console.log('🔑 Admin token verified');
        req.user = 'admin';
        req.userRole = 'admin';
        req.userObj = {
          _id: 'admin',
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

module.exports = { auth, authorize, adminOnly, doctorOnly, userOnly };