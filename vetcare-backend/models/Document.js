const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  // File Information
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  
  // Storage Information
  url: { type: String, required: true }, // Full URL to access the document
  cloudinaryId: String, // For Cloudinary storage
  s3Key: String, // For S3 storage
  localPath: String, // For local storage (development only)
  
  // Document Classification
  documentType: {
    type: String,
    enum: ['license', 'degree', 'certificate', 'experience', 'photo', 'idProof', 'clinicPhoto'],
    required: true
  },
  category: {
    type: String,
    enum: ['doctor_verification', 'prescription', 'report', 'profile', 'clinic'],
    default: 'doctor_verification'
  },
  
  // Ownership & Access
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  relatedDoctor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor'
  },
  relatedAppointment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Appointment'
  },
  
  // Verification Status
  verificationStatus: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'expired'],
    default: 'pending'
  },
  verifiedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  verifiedAt: Date,
  verificationNotes: String,
  rejectionReason: String,
  
  // Metadata
  isActive: { type: Boolean, default: true },
  isPublic: { type: Boolean, default: false }, // Whether document can be publicly accessed
  expiryDate: Date, // For documents that expire (like licenses)
  
  // Security
  accessToken: String, // For secure document access
  downloadCount: { type: Number, default: 0 },
  lastAccessed: Date,
  
  // Admin Notes
  adminNotes: String,
  tags: [String],
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
documentSchema.index({ uploadedBy: 1, documentType: 1 });
documentSchema.index({ verificationStatus: 1, createdAt: -1 });
documentSchema.index({ relatedDoctor: 1, isActive: 1 });
documentSchema.index({ expiryDate: 1 });

// Virtual for public access URL
documentSchema.virtual('publicUrl').get(function() {
  if (this.isPublic && this.url) {
    return this.url;
  }
  return `/api/documents/secure/${this._id}`;
});

// Virtual for file size in human readable format
documentSchema.virtual('humanSize').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Method to generate secure access token
documentSchema.methods.generateAccessToken = function() {
  const crypto = require('crypto');
  this.accessToken = crypto.randomBytes(32).toString('hex');
  return this.accessToken;
};

// Method to check if document is expired
documentSchema.methods.isExpired = function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
};

// Method to increment download count
documentSchema.methods.recordAccess = function() {
  this.downloadCount += 1;
  this.lastAccessed = new Date();
  return this.save();
};

// Static method to get documents by doctor
documentSchema.statics.getDocumentsByDoctor = function(doctorId, verificationStatus = null) {
  const query = { relatedDoctor: doctorId, isActive: true };
  if (verificationStatus) {
    query.verificationStatus = verificationStatus;
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to get pending documents for admin
documentSchema.statics.getPendingDocuments = function() {
  return this.find({ 
    verificationStatus: 'pending', 
    isActive: true 
  })
  .populate('uploadedBy', 'name email')
  .populate('relatedDoctor', 'name email specialization')
  .sort({ createdAt: -1 });
};

// Pre-save middleware to generate access token for private documents
documentSchema.pre('save', function(next) {
  if (this.isNew && !this.isPublic && !this.accessToken) {
    this.generateAccessToken();
  }
  next();
});

module.exports = mongoose.model('Document', documentSchema);