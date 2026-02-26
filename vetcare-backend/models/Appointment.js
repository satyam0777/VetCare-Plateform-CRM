
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: String, required: true }, // e.g. "2025-07-10"
  time: { type: String, required: true }, // e.g. "10:30 AM"
  petName: { type: String },
  reason: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'report_ready'], 
    default: 'pending' 
  },
  // Prescription and payment details
  prescription: {
    medicines: [{
      name: { type: String },
      dosage: { type: String },
      frequency: { type: String },
      duration: { type: String },
      instructions: { type: String }
    }],
    diagnosis: { type: String },
    notes: { type: String },
    prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    prescribedAt: { type: Date }
  },
  payment: {
    consultationFee: { type: Number, default: 0 },
    medicineCharges: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    status: { 
      type: String, 
      enum: ['pending', 'paid', 'failed', 'refunded'], 
      default: 'pending' 
    },
    method: { 
      type: String, 
      enum: ['razorpay', 'stripe', 'wallet', 'cash'],
      default: 'razorpay'
    },
    orderId: String, // Razorpay order ID
    paymentId: String, // Razorpay payment ID
    transactionId: String, // Internal transaction ID
    paidAt: Date,
    refundId: String,
    refundStatus: {
      type: String,
      enum: ['none', 'pending', 'processed', 'failed'],
      default: 'none'
    },
    refundAmount: Number,
    refundedAt: Date,
    
    // =====  REVENUE TRACKING  =====
    platformCommission: { type: Number, default: 0 }, // 15% of consultation fee
    doctorEarnings: { type: Number, default: 0 },      // 85% of consultation fee
    commissionRate: { type: Number, default: 0.15 },   // 15% commission rate
    
    // Doctor payout tracking
    doctorPayout: { 
      type: String, 
      enum: ['pending', 'processed', 'failed'], 
      default: 'pending' 
    },
    payoutDate: Date,
    payoutReference: String, // Bank transaction reference
    
    // Revenue analytics
    revenueMonth: String,  // "2025-01" for monthly tracking
    revenueYear: Number,   // 2025 for yearly tracking
    
    paymentMethod: { type: String }
  },
  // Consultation details
  consultation: {
    symptoms: { type: String },
    examination: { type: String },
    diagnosis: { type: String },
    recommendations: { type: String },
    followUpRequired: { type: Boolean, default: false },
    followUpDate: { type: Date }
  },
  // Report generation
  reportGenerated: { type: Boolean, default: false },
  reportGeneratedAt: { type: Date },
  
  // Timestamps
  confirmedAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
appointmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-calculate commission and earnings when payment details change
  if (this.payment && this.payment.consultationFee > 0) {
    const consultationFee = this.payment.consultationFee;
    const commissionRate = this.payment.commissionRate || 0.15;
    
    this.payment.platformCommission = Math.round(consultationFee * commissionRate);
    this.payment.doctorEarnings = consultationFee - this.payment.platformCommission;
    
    // Set revenue tracking fields
    const now = new Date();
    this.payment.revenueMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.payment.revenueYear = now.getFullYear();
  }
  
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
