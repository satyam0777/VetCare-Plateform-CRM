// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' }
// });


// const userSchema = new mongoose.Schema({
//   name: String,
//   email: { type: String, unique: true },
//   petName: String,
// });

// module.exports = mongoose.model('User', userSchema);


// const userSchema = new mongoose.Schema({
//   name: String,
//   email: { type: String, required: true, unique: true },
//   petName: String,
// });

// module.exports = mongoose.model('User', userSchema);


const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Reactivation request (if user requests reactivation after deactivation)
  reactivationRequest: {
    requested: { type: Boolean, default: false },
    reason: { type: String, default: null },
    requestedAt: { type: Date },
    status: { type: String, enum: ['pending', 'approved', 'rejected', null], default: null },
    adminResponse: { type: String, default: null },
    respondedAt: { type: Date }
  },
  // Admin action reasons
  deactivationReason: { type: String, default: null },
  deletionReason: { type: String, default: null },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile: { type: String },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['farmer', 'doctor', 'owner', 'user', 'admin'], 
    default: 'farmer' 
  },
  
  // Profile Information
  profile: {
    avatar: { type: String, default: null },
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other'], default: null },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'India' }
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String
    }
  },
  
  // Farmer-specific fields
  farmLocation: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  farmSize: String,
  animalTypes: [String], // cattle, goat, sheep, etc.
  
  // Animals owned by farmer
  animals: [{
    name: String,
    species: { type: String, enum: ['cow', 'buffalo', 'goat', 'sheep', 'pig', 'chicken', 'other'] },
    breed: String,
    age: Number,
    weight: Number,
    healthStatus: { type: String, enum: ['healthy', 'sick', 'recovering'], default: 'healthy' },
    lastCheckup: Date,
    tags: [String],
    profileImage: String
  }],
  
  // Doctor-specific fields
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  doctorUniqueLink: String, // Unique secure link for doctor dashboard
  
  // Subscription & Payments
  subscription: {
    type: { type: String, enum: ['free', 'basic', 'premium', 'enterprise'], default: 'free' },
    status: { type: String, enum: ['active', 'inactive', 'cancelled', 'suspended'], default: 'active' },
    startDate: Date,
    endDate: Date,
    autoRenew: { type: Boolean, default: false },
    paymentHistory: [{
      amount: Number,
      date: Date,
      status: String,
      razorpayOrderId: String,
      razorpayPaymentId: String
    }]
  },

  // Payment Status & Restrictions
  paymentStatus: {
    hasPendingPayments: { type: Boolean, default: false },
    unpaidAmount: { type: Number, default: 0 },
    lastPaymentDate: Date,
    canBookAppointments: { type: Boolean, default: true },
    paymentRestrictions: {
      blocked: { type: Boolean, default: false },
      blockedReason: String,
      blockedSince: Date,
      minimumPaymentRequired: { type: Number, default: 0 }
    },
    pendingConsultations: [{
      appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
      doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
      amount: Number,
      dueDate: Date,
      consultationDate: Date,
      status: { type: String, enum: ['pending', 'overdue'], default: 'pending' }
    }]
  },
  
  // Legacy subscription fields (keeping for backward compatibility)
  subscriptionTier: { 
    type: String, 
    enum: ['free', 'premium'], 
    default: 'free' 
  },
  subscriptionExpiry: Date,
  subscriptionFeatures: {
    priorityBooking: { type: Boolean, default: false },
    unlimitedReports: { type: Boolean, default: false },
    videoCall: { type: Boolean, default: false },
    fileUpload: { type: Boolean, default: false }
  },

  // Notification Preferences
  notificationPreferences: {
    pushNotifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    appointmentReminders: { type: Boolean, default: true },
    appointmentUpdates: { type: Boolean, default: true },
    paymentNotifications: { type: Boolean, default: true },
    promotionalEmails: { type: Boolean, default: false },
    marketingCommunications: { type: Boolean, default: false },
    quietHours: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '22:00' },
      endTime: { type: String, default: '08:00' }
    }
  },

  // Device Management for Push Notifications
  devices: [{
    deviceId: { type: String, required: true },
    fcmToken: { type: String, required: true },
    deviceType: { type: String, enum: ['web', 'android', 'ios'], default: 'web' },
    isActive: { type: Boolean, default: true },
    registeredAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
    appVersion: String,
    osVersion: String
  }],

  // Activity Tracking
  activity: {
    lastLogin: Date,
    lastAppointmentDate: Date,
    totalAppointments: { type: Number, default: 0 },
    totalPayments: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    loginCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 }
  },
  
  // Status and verification
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  phoneVerificationCode: String,
  phoneVerificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Security Settings
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String,
    lastPasswordChange: Date,
    failedLoginAttempts: { type: Number, default: 0 },
    accountLockedUntil: Date,
    loginHistory: [{
      ip: String,
      userAgent: String,
      location: String,
      timestamp: { type: Date, default: Date.now },
      success: Boolean
    }]
  },
  
  // Preferences (Enhanced)
  preferences: {
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    preferredCommunication: { type: String, enum: ['email', 'sms', 'both'], default: 'email' },
    reminderTiming: { type: Number, default: 24 } // hours before appointment
  },

  // Account Status
  status: { type: String, enum: ['active', 'inactive', 'suspended', 'banned', 'deleted'], default: 'active' },
  
  // Referral System
  referral: {
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    referralCount: { type: Number, default: 0 },
    referralEarnings: { type: Number, default: 0 }
  },

  // Compliance & Legal
  compliance: {
    termsAccepted: { type: Boolean, default: false },
    termsAcceptedDate: Date,
    privacyPolicyAccepted: { type: Boolean, default: false },
    privacyPolicyAcceptedDate: Date,
    marketingConsent: { type: Boolean, default: false },
    dataProcessingConsent: { type: Boolean, default: false }
  },
  
  // Analytics (Enhanced)
  stats: {
    totalAppointments: { type: Number, default: 0 },
    completedAppointments: { type: Number, default: 0 },
    lastAppointment: Date
  },

  // System Metadata
  metadata: {
    source: { type: String, enum: ['web', 'mobile_app', 'admin_created', 'api'], default: 'web' },
    tags: [String],
    notes: String,
    priority: { type: String, enum: ['low', 'normal', 'high', 'vip'], default: 'normal' }
  },
  
  // Timestamps
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
  ,
  // Password reset fields
  resetPasswordCode: { type: String },
  resetPasswordExpires: { type: Date }
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ mobile: 1 });
userSchema.index({ 'devices.fcmToken': 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for account age
userSchema.virtual('accountAge').get(function() {
  const ageInDays = Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
  return ageInDays;
});

// Method to check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.security.accountLockedUntil && this.security.accountLockedUntil > Date.now());
};

// Method to increment failed login attempts
userSchema.methods.incFailedLoginAttempts = function() {
  if (this.security.accountLockedUntil && this.security.accountLockedUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'security.accountLockedUntil': 1, 'security.failedLoginAttempts': 1 }
    });
  }

  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000; // 30 minutes

  const updates = { $inc: { 'security.failedLoginAttempts': 1 } };
  
  if (this.security.failedLoginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { 'security.accountLockedUntil': Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

// Method to reset failed login attempts
userSchema.methods.resetFailedLoginAttempts = function() {
  return this.updateOne({
    $unset: { 'security.failedLoginAttempts': 1, 'security.accountLockedUntil': 1 }
  });
};

// Method to generate referral code
userSchema.methods.generateReferralCode = function() {
  const code = this.name.replace(/\s+/g, '').toLowerCase() + 
               Math.random().toString(36).substring(2, 8).toUpperCase();
  this.referral.referralCode = code;
  return code;
};

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Generate referral code if not exists
  if (this.isNew && !this.referral.referralCode) {
    this.generateReferralCode();
  }
  
  // Update last password change
  if (this.isModified('password')) {
    this.security.lastPasswordChange = new Date();
  }

  next();
});

// Static method to find active users
userSchema.statics.findActiveUsers = function() {
  return this.find({ status: 'active' });
};

// Static method to get user statistics
userSchema.statics.getUserStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
      }
    }
  ]);
};

module.exports = mongoose.model('User', userSchema);


// This code defines a Mongoose schema for a User model in a veterinary care application.
// The User schema includes fields for name, email, password, and role, with validation rules in place.
// The role field can be 'patient', 'doctor', or 'admin', with 'patient' as the default.
// The model is then exported for use in other parts of the application, such as authentication and user management.
// This schema is essential for managing user data and roles within the application, allowing for different functionalities