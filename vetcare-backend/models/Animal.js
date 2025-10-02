const mongoose = require('mongoose');

const animalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['cattle', 'buffalo', 'goat', 'sheep', 'pig', 'chicken', 'horse', 'other']
  },
  breed: String,
  age: { type: Number, required: true }, // in years
  weight: Number, // in kg
  gender: { 
    type: String, 
    enum: ['male', 'female'], 
    required: true 
  },
  
  // Identification
  tagNumber: String,
  microchipId: String,
  
  // Owner Information
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Health Status
  healthStatus: { 
    type: String, 
    enum: ['healthy', 'sick', 'under_treatment', 'recovered'], 
    default: 'healthy' 
  },
  
  // Medical History
  vaccinations: [{
    vaccine: String,
    dateGiven: Date,
    nextDue: Date,
    givenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }
  }],
  
  allergies: [String],
  chronicConditions: [String],
  
  // Images
  images: [String],
  
  // Status
  isActive: { type: Boolean, default: true },
  
}, { timestamps: true });

module.exports = mongoose.model('Animal', animalSchema);