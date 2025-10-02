const mongoose = require('mongoose');

const videoCallSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  channelName: {
    type: String,
    required: true,
    unique: true
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    userType: {
      type: String,
      enum: ['doctor', 'patient'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: null
    },
    leftAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['waiting', 'joined', 'left'],
      default: 'waiting'
    }
  }],
  status: {
    type: String,
    enum: ['initialized', 'active', 'ended', 'failed'],
    default: 'initialized'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  bothJoinedAt: {
    type: Date,
    default: null
  },
  endedAt: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  endReason: {
    type: String,
    enum: ['completed', 'cancelled', 'technical_issue', 'no_show'],
    default: null
  },
  qualityMetrics: {
    ratings: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
      },
      submittedAt: {
        type: Date,
        default: Date.now
      }
    }],
    averageRating: {
      type: Number,
      default: 0
    },
    feedback: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      feedback: {
        type: String,
        required: true
      },
      issues: [{
        type: String,
        enum: ['audio_issues', 'video_issues', 'connection_drops', 'poor_quality', 'other']
      }],
      submittedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  technicalMetrics: {
    networkQuality: {
      type: String,
      enum: ['excellent', 'good', 'poor', 'unknown'],
      default: 'unknown'
    },
    reconnectionAttempts: {
      type: Number,
      default: 0
    },
    totalDisconnections: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
videoCallSchema.index({ appointment: 1 });
videoCallSchema.index({ 'participants.userId': 1 });
videoCallSchema.index({ startedAt: -1 });
videoCallSchema.index({ status: 1 });

// Virtual for formatted duration
videoCallSchema.virtual('formattedDuration').get(function() {
  if (this.duration === 0) return '0 minutes';
  
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  
  if (minutes === 0) return `${seconds} seconds`;
  if (seconds === 0) return `${minutes} minutes`;
  return `${minutes}m ${seconds}s`;
});

// Method to check if user can join call
videoCallSchema.methods.canUserJoin = function(userId) {
  return this.participants.some(p => 
    p.userId.toString() === userId.toString() && 
    this.status === 'initialized'
  );
};

// Method to get participant info
videoCallSchema.methods.getParticipant = function(userId) {
  return this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
};

// Static method to get active calls count
videoCallSchema.statics.getActiveCalls = function() {
  return this.countDocuments({ 
    status: { $in: ['initialized', 'active'] } 
  });
};

// Static method to get call statistics
videoCallSchema.statics.getCallStats = function(fromDate, toDate) {
  return this.aggregate([
    {
      $match: {
        startedAt: { 
          $gte: fromDate,
          $lte: toDate 
        }
      }
    },
    {
      $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        completedCalls: {
          $sum: { $cond: [{ $eq: ['$status', 'ended'] }, 1, 0] }
        },
        averageDuration: { $avg: '$duration' },
        totalDuration: { $sum: '$duration' },
        averageRating: { $avg: '$qualityMetrics.averageRating' }
      }
    }
  ]);
};

// Pre-save middleware to generate unique channel name
videoCallSchema.pre('save', function(next) {
  if (this.isNew && !this.channelName) {
    this.channelName = `vetcare_${this.appointment}_${Date.now()}`;
  }
  next();
});

// Post-save middleware for logging
videoCallSchema.post('save', function(doc) {
  if (doc.status === 'ended') {
    console.log(`📞 Video call ended: ${doc._id}, Duration: ${doc.formattedDuration}`);
  }
});

module.exports = mongoose.model('VideoCall', videoCallSchema);