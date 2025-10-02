const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientRole: { type: String, enum: ['farmer', 'user', 'doctor', 'admin', 'all'], required: true },
  
  // Notification Type
  type: {
    type: String,
    enum: [
      'appointment_reminder',
      'appointment_confirmed',
      'appointment_cancelled',
      'appointment_rescheduled',
      'new_message',
      'doctor_approved',
      'doctor_rejected',
      'payment_successful',
      'payment_failed',
      'subscription_expiry',
      'new_report_available',
      'follow_up_reminder',
      'vaccination_due',
      'system_announcement',
      'doctor_online',
      'emergency_alert'
    ],
    required: true
  },
  
  // Content
  title: { type: String, required: true },
  message: { type: String, required: true },
  
  // Rich content
  data: mongoose.Schema.Types.Mixed, // Can store any additional data
  
  // Status
  isRead: { type: Boolean, default: false },
  readAt: Date,
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Channels
  channels: {
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    inApp: { type: Boolean, default: true }
  },
  
  // Delivery Status
  deliveryStatus: {
    push: { 
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    }
  },
  
  // Related entities
  relatedEntities: {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal' },
    report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }
  },
  
  // Actions
  actions: [{
    label: String,
    action: String, // URL or action type
    style: { type: String, enum: ['primary', 'secondary', 'danger'], default: 'primary' }
  }],
  
  // Schedule (for future notifications)
  scheduledFor: Date,
  isSent: { type: Boolean, default: false },
  
  // Expiry
  expiresAt: Date,
  
  // Category (for grouping)
  category: {
    type: String,
    enum: ['appointment', 'medical', 'payment', 'system', 'communication', 'reminder'],
    default: 'system'
  }
  
}, { timestamps: true });

// Index for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1, scheduledFor: 1 });
notificationSchema.index({ isRead: 1, recipient: 1 });

// Mark as read method
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Check if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

module.exports = mongoose.model('Notification', notificationSchema);