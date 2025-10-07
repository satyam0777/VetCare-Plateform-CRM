const dotenv = require('dotenv');
dotenv.config();
const express = require('express');

const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
// const mongoSanitize = require('express-mongo-sanitize'); // Disabled due to compatibility
// const xss = require('xss-clean'); // Disabled due to compatibility  
const hpp = require('hpp');

const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const doctorsRoutes = require('./routes/doctors');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointments');
const userRoutes = require('./routes/users');
const consultationRoutes = require('./routes/consultations');
const animalRoutes = require('./routes/animals');
const adminRoutes = require('./routes/admin');
const otpRoutes = require('./routes/otp');
const reportsRoutes = require('./routes/reports'); // New reports system
const doctorAccessRoutes = require('./routes/doctorAccess');
const subscriptionRoutes = require('./routes/subscription');
const filesRoutes = require('./routes/files'); // File serving for documents

// Import upload middleware
const upload = require('./middleware/upload');

// // Load environment variables
// dotenv.config();

// ✅ Initialize email service after dotenv is loaded
const { initializeEmailService, sendEmail } = require('./services/emailService');
initializeEmailService().then(async () => {
  // Send a test email on server startup using the main sendEmail (SendGrid in prod)
  try {
    const testTo = process.env.EMAIL_USER || 'vetcare0777@gmail.com';
    const testSubject = '[VetCare] Test Email on Startup';
    const testHtml = '<b>This is a test email sent automatically when the server starts.</b>';
    const result = await sendEmail({ to: testTo, subject: testSubject, html: testHtml });
    console.log('📧 [Startup Test] Email result:', result);
  } catch (e) {
    console.error('❌ Test email send failed:', e);
  }
});

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Test email endpoint for debugging SendGrid integration
app.get('/api/test-email', async (req, res) => {
  const to = process.env.TEST_EMAIL_TO || 'vetcare0777@gmail.com';
  const subject = '[VetCare] Test Email from /api/test-email';
  const text = 'This is a test email sent from the /api/test-email endpoint.';
  try {
    const result = await sendEmail({ to, subject, text });
    res.json({ success: result.success, message: result.message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Socket.IO setup for real-time features
const io = socketIO(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// CORS configuration
app.use(cors({
  origin: [
    'https://vet-care-plateform-crm.vercel.app', // your Vercel frontend
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Doctor-Link']
}));

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"]
    },
  },
}));

// Rate limiting - Adjusted for normal app usage
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 1000, // Increased for normal app usage
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API-specific rate limiting - More generous for app functionality
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Increased from 50 to 500 for normal app usage
  message: {
    error: 'Too many API requests from this IP, please try again later.'
  }
});

// Stricter rate limiting for auth endpoints only
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Increased from 5 to 20 for better UX
  message: {
    error: 'Too many authentication attempts from this IP, please try again later.'
  }
});

// Apply rate limiting - Only general limiter for most routes
app.use(limiter);
// Removed: app.use('/api/', apiLimiter); - This was too restrictive
app.use('/api/auth/', authLimiter);

// Data sanitization against NoSQL query injection (disabled due to compatibility issue)
// app.use(mongoSanitize({
//   replaceWith: '_'
// }));

// Data sanitization against XSS (disabled due to compatibility issue with Node.js v22)
// app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: ['role', 'status', 'type'] // Allow duplicate parameters for these fields
}));


// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make io available to routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  // Join consultation room
  socket.on('join_consultation', (data) => {
    socket.join(data.consultationId);
    // Notify others in the room
    socket.to(data.consultationId).emit('user_joined', {
      userId: data.userId,
      userType: data.userType,
      message: `${data.userType} joined the consultation`
    });
  });
  
  // Handle new messages
  socket.on('send_message', (data) => {
    socket.to(data.consultationId).emit('receive_message', data);
  });
  
  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(data.consultationId).emit('user_typing', data);
  });
  
  socket.on('typing_stop', (data) => {
    socket.to(data.consultationId).emit('user_stopped_typing', data);
  });
  
  // Handle doctor status updates
  socket.on('doctor_status_update', (data) => {
    socket.broadcast.emit('doctor_status_changed', data);
  });
  
  // Handle video call events
  socket.on('video_call_request', (data) => {
    socket.to(data.consultationId).emit('incoming_video_call', data);
  });
  
  socket.on('video_call_response', (data) => {
    socket.to(data.consultationId).emit('video_call_response', data);
  });
  
  // Handle consultation status updates
  socket.on('consultation_status_update', (data) => {
    socket.to(data.consultationId).emit('consultation_status_changed', data);
  });
  
  // --- WebRTC Video Call Signaling ---
  socket.on('webrtc_offer', (data) => {
    socket.to(data.consultationId).emit('webrtc_offer', data);
  });
  socket.on('webrtc_answer', (data) => {
    socket.to(data.consultationId).emit('webrtc_answer', data);
  });
  socket.on('webrtc_ice_candidate', (data) => {
    socket.to(data.consultationId).emit('webrtc_ice_candidate', data);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use('/api/doctors', doctorsRoutes); // Main doctor management
app.use('/api/doctor', doctorRoutes);   // Doctor verification and access
app.use('/api/appointments', appointmentRoutes); // Enhanced appointment system
app.use('/api/consultations', consultationRoutes); // New consultation system
app.use('/api/consultation', require('./routes/consultation-payment')); // Post-consultation payment flow
app.use('/api/animals', animalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/reports', reportsRoutes); // New reports system
app.use('/api/doctor-access', doctorAccessRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/files', filesRoutes); // File serving for uploaded documents

// Document Management Routes (NEW - Cloud Storage)
try {
  const documentRoutes = require('./routes/documents');
  app.use('/api/documents', documentRoutes);
  console.log('✅ Document Management routes loaded');
} catch (error) {
  console.log('⚠️  Document Management routes error:', error.message);
}

// ===== STARTUP-READY FEATURES =====
// Doctor Verification System (IMMEDIATE NEED)
try {
  const doctorVerificationRoutes = require('./routes/doctor-verification');
  app.use('/api/doctor-verification', doctorVerificationRoutes);
  console.log('✅ Doctor Verification routes loaded');
} catch (error) {
  console.log('⚠️  Doctor Verification routes error:', error.message);
}

// Earnings & Commission Tracking (REVENUE CRITICAL)
try {
  const earningsRoutes = require('./routes/earnings');
  app.use('/api/earnings', earningsRoutes);
  console.log('✅ Earnings & Commission routes loaded');
} catch (error) {
  console.log('⚠️  Earnings routes error:', error.message);
}

// Payment Gateway Integration (Razorpay)
try {
  const paymentsRoutes = require('./routes/payments');
  app.use('/api/payments', paymentsRoutes);
  console.log('✅ Payment Gateway routes loaded');
} catch (error) {
  console.log('⚠️  Payment Gateway routes error:', error.message);
}

// Video Call System (Agora.io)
try {
  const videoRoutes = require('./routes/video');
  app.use('/api/video', videoRoutes);
  console.log('✅ Video Call routes loaded');
} catch (error) {
  console.log('⚠️  Video Call routes error:', error.message);
}

// Push Notifications (Firebase)
try {
  const notificationRoutes = require('./routes/notifications');
  app.use('/api/notifications', notificationRoutes);
  console.log('✅ Notification routes loaded');
} catch (error) {
  console.log('⚠️  Notification routes error:', error.message);
}

// Health check route
app.get('/api/health', (req, res) => {
  const features = [
    'Real-time Chat', 
    'Video Calls', 
    'File Upload', 
    'Multi-role Dashboard',
    'Payment Gateway (Razorpay)',
    'Push Notifications (Firebase)',
    'Advanced Analytics',
    'Subscription Management'
  ];

  const configStatus = {
    payment: process.env.RAZORPAY_KEY_ID ? '✅ Razorpay Configured' : '❌ Configure Razorpay',
    video: process.env.AGORA_APP_ID ? '✅ Agora Configured' : '❌ Configure Agora',
    notifications: process.env.FIREBASE_PROJECT_ID ? '✅ Firebase Configured' : '❌ Configure Firebase',
    email: process.env.EMAIL_USER ? '✅ Gmail SMTP Configured' : '❌ Configure Gmail SMTP'
  };

  res.json({ 
    message: '🚀 VetCare Startup API - Production Ready!', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    status: 'STARTUP READY',
    features,
    configuration: configStatus,
    socketConnections: io.engine.clientsCount,
    endpoints: [
      '/api/payments/* - Payment Gateway',
      '/api/video/* - Video Calling',
      '/api/notifications/* - Push Notifications',
      
    ]
  });
});

// File upload endpoints
app.post('/api/upload', upload.single, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: `/uploads/${req.file.filename}`,
        uploadedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed', details: error.message });
  }
});

// Multiple files upload endpoint
app.post('/api/upload/multiple', upload.multiple, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const fileData = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date()
    }));
    
    res.json({
      success: true,
      message: `${req.files.length} files uploaded successfully`,
      files: fileData
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ error: 'Multiple file upload failed', details: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'API endpoint not found', 
    availableEndpoints: [
      '/api/health',
      '/api/auth/*',
      '/api/doctors/*',
      '/api/consultations/*',
      '/api/appointments/*',
      '/api/animals/*',
      '/api/admin/*',
      '/api/upload'
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 5000;

// ✅ Add better error handling for port conflicts
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use! Please stop the process using this port and try again.`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 VetCare server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for real-time communication`);
  console.log(`🔗 Frontend URL: http://localhost:5173`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// ✅ Add graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close database connection  
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close(() => {
        console.log('✅ Database connection closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.log('⚠️ Forcing shutdown...');
    process.exit(1);
  }, 10000);
};

// Handle different shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});
