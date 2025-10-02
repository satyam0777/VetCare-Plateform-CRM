const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  consultation: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Consultation', 
    required: true 
  },
  
  messages: [{
    sender: { 
      type: String, 
      enum: ['farmer', 'doctor'], 
      required: true 
    },
    senderDetails: {
      id: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true }
    },
    
    messageType: { 
      type: String, 
      enum: ['text', 'image', 'file', 'system'], 
      default: 'text' 
    },
    
    content: { type: String, required: true },
    
    // For file/image messages
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
    
    // Message status
    status: { 
      type: String, 
      enum: ['sent', 'delivered', 'read'], 
      default: 'sent' 
    }
  }],
  
  // Chat Status
  isActive: { type: Boolean, default: true },
  lastActivity: { type: Date, default: Date.now },
  
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);