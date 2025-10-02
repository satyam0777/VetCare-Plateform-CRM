// const mongoose = require('mongoose');

// const appointmentSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
//   date: { type: String, required: true }, // e.g. "2025-07-10"
//   time: { type: String, required: true }, // e.g. "10:30 AM"
//   petName: { type: String },
//   reason: { type: String },
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model('Appointment', appointmentSchema);
// This code defines a Mongoose schema for an Appointment model in a veterinary care application.
// The Appointment schema includes fields for user ID, doctor ID, date, time, pet name, reason for the appointment, and a timestamp for when the appointment was created.
// The user and doctor fields reference the User and Doctor models, respectively, allowing for relationships between these entities.
// The schema is then exported for use in other parts of the application, such as appointment management


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
      enum: ['pending', 'completed', 'failed', 'refunded'], 
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
    platformFee: { type: Number, default: 0 },
    doctorEarnings: { type: Number, default: 0 },
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
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
