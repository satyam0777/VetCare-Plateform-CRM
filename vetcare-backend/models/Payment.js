const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Basic Payment Information
  orderId: { type: String, required: true, unique: true },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  
  // Payment Details
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { 
    type: String, 
    enum: ['created', 'pending', 'paid', 'failed', 'cancelled', 'refunded'], 
    default: 'created' 
  },
  
  // Related Entities
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  
  // VetCare Platform Financial Distribution
  financialBreakdown: {
    // Total amount paid by user
    totalAmount: { type: Number, required: true },
    
    // Platform commission (18%)
    platformFee: { type: Number, required: true },
    platformFeePercentage: { type: Number, default: 18 },
    
    // Doctor payout (82%)
    doctorPayout: { type: Number, required: true },
    doctorPayoutPercentage: { type: Number, default: 82 },
    
    // Tax information
    gst: { type: Number, default: 0 },
    gstPercentage: { type: Number, default: 18 },
    
    // Gateway charges
    paymentGatewayFee: { type: Number, default: 0 },
    gatewayFeePercentage: { type: Number, default: 2.4 }
  },
  
  // Payout Status to Doctor
  doctorPayout: {
    status: { 
      type: String, 
      enum: ['pending', 'processed', 'failed', 'on_hold'], 
      default: 'pending' 
    },
    processedAt: Date,
    payoutId: String, // Bank transfer reference
    failureReason: String,
    nextAttemptAt: Date,
    attemptCount: { type: Number, default: 0 }
  },
  
  // Consultation Details
  consultationDetails: {
    consultationFee: Number,
    medicineCharges: Number,
    additionalCharges: Number,
    description: String
  },
  
  // Payment Method
  paymentMethod: {
    type: { type: String, enum: ['card', 'netbanking', 'upi', 'wallet'], default: 'card' },
    bank: String,
    wallet: String,
    card: {
      last4: String,
      brand: String
    }
  },
  
  // Platform Environment Variables Integration
  platformBankDetails: {
    accountNumber: { type: String, default: process.env.VETCARE_BANK_ACCOUNT },
    ifscCode: { type: String, default: process.env.VETCARE_BANK_IFSC },
    accountHolderName: { type: String, default: process.env.VETCARE_BANK_HOLDER_NAME },
    bankName: { type: String, default: process.env.VETCARE_BANK_NAME }
  },
  
  // User Payment Restriction Impact
  userPaymentHistory: {
    previousUnpaidAmount: { type: Number, default: 0 },
    isFirstPayment: { type: Boolean, default: false },
    paymentRestrictionsLifted: { type: Boolean, default: false },
    canBookNewAppointments: { type: Boolean, default: true }
  },
  
  // Audit Trail
  auditLog: [{
    action: String, // 'created', 'paid', 'failed', 'payout_processed', etc.
    timestamp: { type: Date, default: Date.now },
    details: mongoose.Schema.Types.Mixed,
    performedBy: String
  }],
  
  // Refund Information
  refund: {
    isRefunded: { type: Boolean, default: false },
    refundAmount: Number,
    refundReason: String,
    refundProcessedAt: Date,
    refundTransactionId: String
  },
  
  // Metadata
  metadata: {
    userAgent: String,
    ipAddress: String,
    source: { type: String, enum: ['web', 'mobile', 'admin'], default: 'web' },
    campaign: String,
    notes: String
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  paidAt: Date,
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for performance
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ doctorId: 1, 'doctorPayout.status': 1 });
paymentSchema.index({ appointmentId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ 'doctorPayout.status': 1, 'doctorPayout.processedAt': 1 });

// Pre-save middleware to calculate financial breakdown
paymentSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('amount')) {
    const totalAmount = this.amount;
    
    // Calculate platform fee (18%)
    const platformFee = Math.round(totalAmount * 0.18);
    
    // Calculate doctor payout (82%)
    const doctorPayout = Math.round(totalAmount * 0.82);
    
    // Calculate payment gateway fee (2.4% of total)
    const paymentGatewayFee = Math.round(totalAmount * 0.024);
    
    this.financialBreakdown = {
      totalAmount,
      platformFee,
      platformFeePercentage: 18,
      doctorPayout,
      doctorPayoutPercentage: 82,
      paymentGatewayFee,
      gatewayFeePercentage: 2.4
    };
  }
  
  this.updatedAt = Date.now();
  next();
});

// Static method to get platform revenue
paymentSchema.statics.getPlatformRevenue = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        status: 'paid',
        paidAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$financialBreakdown.platformFee' },
        totalPayments: { $sum: 1 },
        totalTransactionValue: { $sum: '$amount' }
      }
    }
  ]);
};

// Static method to get doctor earnings
paymentSchema.statics.getDoctorEarnings = function(doctorId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        doctorId: mongoose.Types.ObjectId(doctorId),
        status: 'paid',
        paidAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$financialBreakdown.doctorPayout' },
        pendingPayout: { 
          $sum: { 
            $cond: [
              { $eq: ['$doctorPayout.status', 'pending'] }, 
              '$financialBreakdown.doctorPayout', 
              0
            ] 
          } 
        },
        totalConsultations: { $sum: 1 }
      }
    }
  ]);
};

// Instance method to mark as paid
paymentSchema.methods.markAsPaid = function(razorpayPaymentId, razorpaySignature) {
  this.status = 'paid';
  this.paidAt = new Date();
  this.razorpayPaymentId = razorpayPaymentId;
  this.razorpaySignature = razorpaySignature;
  
  // Add to audit log
  this.auditLog.push({
    action: 'payment_successful',
    details: { razorpayPaymentId, razorpaySignature },
    performedBy: 'razorpay_webhook'
  });
  
  return this.save();
};

// Instance method to process doctor payout
paymentSchema.methods.processDoctorPayout = function(payoutId) {
  this.doctorPayout.status = 'processed';
  this.doctorPayout.processedAt = new Date();
  this.doctorPayout.payoutId = payoutId;
  
  this.auditLog.push({
    action: 'doctor_payout_processed',
    details: { payoutId, amount: this.financialBreakdown.doctorPayout },
    performedBy: 'payout_system'
  });
  
  return this.save();
};

module.exports = mongoose.model('Payment', paymentSchema);