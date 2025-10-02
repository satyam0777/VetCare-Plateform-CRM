const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  // Basic Info
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true },
  
  // Appointment Details
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, required: true },
  
  // Consultation Type
  consultationType: { 
    type: String, 
    enum: ['text_chat', 'video_call', 'in_person', 'emergency'], 
    default: 'text_chat' 
  },
  
  // Status
  status: { 
    type: String, 
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'], 
    default: 'scheduled' 
  },
  
  // Symptoms & Complaints
  symptoms: [String],
  urgencyLevel: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'emergency'], 
    default: 'medium' 
  },
  description: String,
  
  // Media Files
  attachments: [{
    type: String, // URL or file path
    description: String,
    uploadedBy: { type: String, enum: ['farmer', 'doctor'] }
  }],
  
  // Consultation Details
  startedAt: Date,
  endedAt: Date,
  duration: Number, // in minutes
  
  // Doctor's Assessment
  diagnosis: String,
  treatment: String,
  prescriptions: [{
    medicine: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  
  // Follow-up
  followUpRequired: { type: Boolean, default: false },
  followUpDate: Date,
  doctorNotes: String,
  
  // Billing
  consultationFee: { type: Number, default: 0 },
  isPaid: { type: Boolean, default: false },
  paymentMethod: String,
  
  // Rating & Review (by farmer)
  rating: { type: Number, min: 1, max: 5 },
  review: String,
  
}, { timestamps: true });

module.exports = mongoose.model('Consultation', consultationSchema);