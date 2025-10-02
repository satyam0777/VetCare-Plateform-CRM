const express = require('express');
const router = express.Router();
const { RtcTokenBuilder, RtcRole } = require('agora-token');
const { auth } = require('../middleware/authMiddleware');
const Appointment = require('../models/Appointment');
const VideoCall = require('../models/VideoCall');

// @route   POST /api/video/generate-token
// @desc    Generate Agora RTC token for video call
// @access  Private
router.post('/generate-token', auth, async (req, res) => {
  try {
    const { channelName, appointmentId, role = 'host' } = req.body;

    // Validate appointment access
    const appointment = await Appointment.findById(appointmentId)
      .populate('user doctor');
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if user has access to this call
    const userId = req.user.toString();
    const isAuthorized = appointment.user._id.toString() === userId || 
                        appointment.doctor._id.toString() === userId;
    
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Unauthorized access to video call' });
    }

    // Agora configuration
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const uid = 0; // Use 0 for dynamic assignment
    const userRole = role === 'host' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    // Generate token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      userRole,
      privilegeExpiredTs
    );

    // Save video call session
    const videoCall = new VideoCall({
      appointment: appointmentId,
      channelName,
      participants: [
        {
          userId: appointment.user._id,
          userType: 'patient',
          joinedAt: null
        },
        {
          userId: appointment.doctor._id,
          userType: 'doctor',
          joinedAt: null
        }
      ],
      status: 'initialized',
      startedAt: new Date()
    });
    await videoCall.save();

    res.json({
      success: true,
      token,
      channelName,
      appId,
      uid,
      callId: videoCall._id,
      appointment: {
        id: appointment._id,
        petName: appointment.petName,
        doctorName: appointment.doctor.name,
        patientName: appointment.user.name
      }
    });

  } catch (error) {
    console.error('❌ Error generating video token:', error);
    res.status(500).json({ error: 'Failed to generate video token' });
  }
});

// @route   POST /api/video/join-call
// @desc    Mark user as joined in video call
// @access  Private
router.post('/join-call', auth, async (req, res) => {
  try {
    const { callId, userType } = req.body;
    const userId = req.user.toString();

    const videoCall = await VideoCall.findById(callId);
    if (!videoCall) {
      return res.status(404).json({ error: 'Video call not found' });
    }

    // Update participant join time
    const participant = videoCall.participants.find(p => 
      p.userId.toString() === userId
    );
    
    if (participant) {
      participant.joinedAt = new Date();
      participant.status = 'joined';
    }

    // Check if both participants joined
    const allJoined = videoCall.participants.every(p => p.joinedAt !== null);
    if (allJoined && videoCall.status === 'initialized') {
      videoCall.status = 'active';
      videoCall.bothJoinedAt = new Date();
    }

    await videoCall.save();

    res.json({
      success: true,
      message: 'Successfully joined video call',
      callStatus: videoCall.status,
      participants: videoCall.participants.length
    });

  } catch (error) {
    console.error('❌ Error joining video call:', error);
    res.status(500).json({ error: 'Failed to join video call' });
  }
});

// @route   POST /api/video/end-call
// @desc    End video call and calculate duration
// @access  Private
router.post('/end-call', auth, async (req, res) => {
  try {
    const { callId, reason = 'completed' } = req.body;
    const userId = req.user.toString();

    const videoCall = await VideoCall.findById(callId)
      .populate('appointment');
    
    if (!videoCall) {
      return res.status(404).json({ error: 'Video call not found' });
    }

    // Check authorization
    const isAuthorized = videoCall.participants.some(p => 
      p.userId.toString() === userId
    );
    
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Calculate call duration
    const endTime = new Date();
    const duration = videoCall.bothJoinedAt 
      ? Math.floor((endTime - videoCall.bothJoinedAt) / 1000) // seconds
      : 0;

    // Update video call
    videoCall.status = 'ended';
    videoCall.endedAt = endTime;
    videoCall.duration = duration;
    videoCall.endReason = reason;

    // Update participant who ended the call
    const participant = videoCall.participants.find(p => 
      p.userId.toString() === userId
    );
    if (participant) {
      participant.leftAt = endTime;
      participant.status = 'left';
    }

    await videoCall.save();

    // Update appointment status if call was completed successfully
    if (reason === 'completed' && duration > 60) { // At least 1 minute
      const appointment = await Appointment.findById(videoCall.appointment._id);
      if (appointment && appointment.status === 'confirmed') {
        appointment.status = 'in-progress';
        appointment.consultation.actualStartTime = videoCall.bothJoinedAt;
        appointment.consultation.actualEndTime = endTime;
        appointment.consultation.duration = duration;
        await appointment.save();
      }
    }

    res.json({
      success: true,
      message: 'Video call ended successfully',
      duration: Math.floor(duration / 60), // minutes
      callSummary: {
        totalDuration: `${Math.floor(duration / 60)} minutes`,
        participantCount: videoCall.participants.length,
        status: videoCall.status
      }
    });

  } catch (error) {
    console.error('❌ Error ending video call:', error);
    res.status(500).json({ error: 'Failed to end video call' });
  }
});

// @route   GET /api/video/call-history/:userId
// @desc    Get video call history for user
// @access  Private
router.get('/call-history/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Verify access
    if (userId !== req.user.toString()) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const videoCalls = await VideoCall.find({
      'participants.userId': userId,
      status: 'ended'
    })
    .populate('appointment', 'petName date time')
    .populate({
      path: 'appointment',
      populate: [
        { path: 'doctor', select: 'name specialization' },
        { path: 'user', select: 'name email' }
      ]
    })
    .sort({ endedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await VideoCall.countDocuments({
      'participants.userId': userId,
      status: 'ended'
    });

    res.json({
      calls: videoCalls.map(call => ({
        id: call._id,
        duration: Math.floor(call.duration / 60), // minutes
        startedAt: call.startedAt,
        endedAt: call.endedAt,
        appointment: call.appointment,
        quality: call.qualityMetrics
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCalls: total
      }
    });

  } catch (error) {
    console.error('❌ Error fetching call history:', error);
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

// @route   POST /api/video/quality-feedback
// @desc    Submit call quality feedback
// @access  Private
router.post('/quality-feedback', auth, async (req, res) => {
  try {
    const { callId, rating, feedback, issues } = req.body;
    const userId = req.user.toString();

    const videoCall = await VideoCall.findById(callId);
    if (!videoCall) {
      return res.status(404).json({ error: 'Video call not found' });
    }

    // Verify user participated in call
    const participant = videoCall.participants.find(p => 
      p.userId.toString() === userId
    );
    
    if (!participant) {
      return res.status(403).json({ error: 'User not part of this call' });
    }

    // Update quality metrics
    if (!videoCall.qualityMetrics) {
      videoCall.qualityMetrics = {
        ratings: [],
        averageRating: 0,
        feedback: []
      };
    }

    videoCall.qualityMetrics.ratings.push({
      userId,
      rating,
      submittedAt: new Date()
    });

    if (feedback) {
      videoCall.qualityMetrics.feedback.push({
        userId,
        feedback,
        issues: issues || [],
        submittedAt: new Date()
      });
    }

    // Calculate average rating
    const ratings = videoCall.qualityMetrics.ratings;
    videoCall.qualityMetrics.averageRating = 
      ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    await videoCall.save();

    res.json({
      success: true,
      message: 'Quality feedback submitted successfully',
      averageRating: videoCall.qualityMetrics.averageRating
    });

  } catch (error) {
    console.error('❌ Error submitting quality feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// @route   GET /api/video/analytics
// @desc    Get video call analytics for admin
// @access  Private (Admin only)
router.get('/analytics', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user);
    
    if (user.role !== 'admin' && user.role !== 'owner') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { period = '30' } = req.query;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(period));

    // Call statistics
    const callStats = await VideoCall.aggregate([
      {
        $match: {
          startedAt: { $gte: fromDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$startedAt' } }
          },
          totalCalls: { $sum: 1 },
          completedCalls: {
            $sum: { $cond: [{ $eq: ['$status', 'ended'] }, 1, 0] }
          },
          averageDuration: { $avg: '$duration' },
          totalDuration: { $sum: '$duration' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Quality metrics
    const qualityStats = await VideoCall.aggregate([
      {
        $match: {
          startedAt: { $gte: fromDate },
          'qualityMetrics.averageRating': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          averageQuality: { $avg: '$qualityMetrics.averageRating' },
          totalRatings: { $sum: { $size: '$qualityMetrics.ratings' } }
        }
      }
    ]);

    res.json({
      period: parseInt(period),
      callStatistics: callStats,
      qualityMetrics: qualityStats[0] || { averageQuality: 0, totalRatings: 0 },
      summary: {
        totalCalls: callStats.reduce((sum, day) => sum + day.totalCalls, 0),
        completedCalls: callStats.reduce((sum, day) => sum + day.completedCalls, 0),
        averageDuration: callStats.length > 0 
          ? callStats.reduce((sum, day) => sum + day.averageDuration, 0) / callStats.length
          : 0
      }
    });

  } catch (error) {
    console.error('❌ Error fetching video analytics:', error);
    res.status(500).json({ error: 'Failed to fetch video analytics' });
  }
});

module.exports = router;