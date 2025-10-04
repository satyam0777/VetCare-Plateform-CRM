const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Basic Info
  title: { type: String, required: true },
  animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  
  // Report Type
  reportType: {
    type: String,
    enum: ['consultation', 'vaccination', 'treatment', 'checkup', 'surgery', 'lab_test', 'prescription'],
    required: true
  },
  
  // Medical Details
  diagnosis: String,
  symptoms: [String],
  treatment: String,
  recommendations: String,
  
  // Medications/Prescriptions
  prescriptions: [{
    medicineName: { type: String, required: true },
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
    cost: Number,
    startDate: Date,
    endDate: Date
  }],
  
  // Vaccinations (if applicable)
  vaccinations: [{
    vaccineName: String,
    batchNumber: String,
    manufacturer: String,
    dateAdministered: Date,
    nextDueDate: Date,
    reactionNotes: String
  }],
  
  // Lab Tests (if applicable)
  labTests: [{
    testName: String,
    result: String,
    normalRange: String,
    notes: String,
    testDate: Date,
    attachments: [String] // URLs to test result images/files
  }],
  
  // Vital Signs
  vitalSigns: {
    temperature: Number,
    heartRate: Number,
    respiratoryRate: Number,
    weight: Number,
    bloodPressure: String,
    notes: String,
    recordedAt: { type: Date, default: Date.now }
  },
  
  // Follow-up
  followUp: {
    required: { type: Boolean, default: false },
    date: Date,
    instructions: String,
    completed: { type: Boolean, default: false }
  },
  
  // Attachments (X-rays, photos, documents)
  attachments: [{
    filename: String,
    originalName: String,
    fileType: String,
    fileSize: Number,
    url: String,
    description: String,
    category: { 
      type: String, 
      enum: ['image', 'xray', 'lab_result', 'document', 'video'],
      default: 'image'
    },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Cost and Billing
  cost: {
    consultationFee: { type: Number, default: 0 },
    medicinesCost: { type: Number, default: 0 },
    testsCost: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  
  // Report Status
  status: {
    type: String,
    enum: ['draft', 'completed', 'reviewed', 'archived'],
    default: 'draft'
  },
  
  // Payment Status for Report Access
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  reportAccessible: { type: Boolean, default: false },
  paymentId: String, // Reference to payment transaction
  paidAt: Date,
  
  // Next Appointment
  nextAppointment: {
    suggested: { type: Boolean, default: false },
    date: Date,
    reason: String
  },
  
  // Emergency Flag
  isEmergency: { type: Boolean, default: false },
  
  // PDF Generation
  pdfGenerated: { type: Boolean, default: false },
  pdfUrl: String,
  pdfGeneratedAt: Date,
  
  // Additional Notes
  doctorNotes: String,
  privateNotes: String, // Only visible to doctor
  
  // Clinical Learning Notes
  clinicalNote: {
    outcome: {
      type: String,
      enum: ['successful', 'complications', 'fatality', 'ongoing'],
    },
    animalBehavior: String,
    outcomeDetails: String,
    lessonsLearned: String,
    preventionStrategy: String,
    complications: String,
    addedAt: { type: Date, default: Date.now },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }
  },
  
}, { timestamps: true });

// Calculate total cost before saving
reportSchema.pre('save', function(next) {
  if (this.cost) {
    this.cost.total = (this.cost.consultationFee || 0) + 
                     (this.cost.medicinesCost || 0) + 
                     (this.cost.testsCost || 0) + 
                     (this.cost.otherCharges || 0);
  }
  next();
});

// Virtual for formatted report date
reportSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

module.exports = mongoose.model('Report', reportSchema);