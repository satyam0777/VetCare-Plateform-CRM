const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  specialization: { type: String, required: true },
  education: String,
  experience: { type: Number, default: 0 }, // in years
  bio: String,
  
  // Professional Details
  licenseNumber: String,
  clinicAddress: String,
  languages: [String],
  
  // Availability & Status
  isOnline: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  workingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '18:00' }
  },
  
  // ===== STARTUP-CRITICAL VERIFICATION SYSTEM =====
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'under_review', 'approved', 'rejected', 'suspended'], 
    default: 'pending' 
  },
  verificationDate: Date,
  verificationNotes: String,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Document Management for Real Doctors
  documents: {
    license: String,        // License document file path
    degree: String,         // Degree certificate file path
    experience: String,     // Experience certificate file path
    photo: String,          // Professional photo file path
    idProof: String,        // Government ID file path
    clinicPhoto: String     // Clinic photo file path
  },
  
  documentsUploaded: {
    license: { type: Boolean, default: false },
    degree: { type: Boolean, default: false },
    experience: { type: Boolean, default: false },
    photo: { type: Boolean, default: false },
    idProof: { type: Boolean, default: false }
  },
  
  // Profile Completeness for Onboarding
  profileCompleteness: { type: Number, default: 0, min: 0, max: 100 },
  
  // Professional Credentials
  qualification: String,
  registrationNumber: String,  // Veterinary council registration
  councilName: String,         // Which veterinary council
  consultationFee: { type: Number, default: 0 },
  
  // Approval Status
  approved: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  
  // Rejection/Deactivation Details
  status: { 
    type: String, 
    enum: ['pending', 'active', 'inactive', 'rejected'], 
    default: 'pending' 
  },
  rejectionReason: String,
  rejectedAt: Date,
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deactivatedAt: Date,
  deactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deactivationReason: String,
  
  // Ratings & Reviews
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  
  // Enhanced Earnings & Analytics
  earnings: {
    total: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
    lastMonth: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    pendingWithdrawal: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 }
  },
  
  // Performance Metrics
  performance: {
    totalAppointments: { type: Number, default: 0 },
    completedAppointments: { type: Number, default: 0 },
    cancelledAppointments: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 }, // in minutes
    successRate: { type: Number, default: 100 }
  },
  
  // Banking Details for Payments
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    verified: { type: Boolean, default: false }
  },
  
  // Subscription & Earnings
  subscriptionType: { 
    type: String, 
    enum: ['commission', 'subscription'], 
    default: 'commission' 
  },
  commissionRate: { type: Number, default: 0.1 }, // 10%
  totalEarnings: { type: Number, default: 0 },
  
  // Consultation Statistics
  totalConsultations: { type: Number, default: 0 },
  completedConsultations: { type: Number, default: 0 },
  
  // Unique Access (UNCHANGED - Your current system works)
  uniqueAccessLink: { type: String, unique: true, sparse: true },
  uniqueLink: { type: String, unique: true, sparse: true }, // Keep both for compatibility
  
  // Profile Image
  profileImage: String,
  
  // Profile Setup
  profileCompleted: { type: Boolean, default: false },
  profileCompletedAt: Date,
  lastLoginAt: Date,
  
  // Status
  isActive: { type: Boolean, default: true },
  
}, { timestamps: true });

// Generate unique access link for approved doctors
doctorSchema.methods.generateAccessLink = function() {
  const crypto = require('crypto');
  this.uniqueAccessLink = `doc_${crypto.randomBytes(16).toString('hex')}`;
  return this.uniqueAccessLink;
};

// Calculate success rate
doctorSchema.virtual('successRate').get(function() {
  if (this.totalConsultations === 0) return 0;
  return Math.round((this.completedConsultations / this.totalConsultations) * 100);
});

module.exports = mongoose.model('Doctor', doctorSchema);
