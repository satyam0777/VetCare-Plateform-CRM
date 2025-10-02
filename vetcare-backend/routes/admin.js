const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { auth } = require('../middleware/authMiddleware');
const emailService = require('../services/emailService');

// Middleware to check if user is admin
const adminMiddleware = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'owner')) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
};

// Apply auth middleware to all admin routes
router.use(auth);
router.use(adminMiddleware);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data with real statistics
// @access  Admin only
router.get('/dashboard', async (req, res) => {
  try {
    // Get real-time statistics
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalDoctors = await Doctor.countDocuments();
    const activeDoctors = await Doctor.countDocuments({ approved: true, status: 'active' });
    const pendingDoctors = await Doctor.countDocuments({ approved: false });
    const totalAppointments = await Appointment.countDocuments();
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    const todayAppointments = await Appointment.countDocuments({
      date: new Date().toISOString().split('T')[0]
    });

    // Calculate success rate
    const successRate = totalAppointments > 0 ? 
      Math.round((completedAppointments / totalAppointments) * 100) : 0;

    // Get recent appointments (last 10)
    const recentAppointments = await Appointment.find()
      .populate('doctor', 'name specialization email')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get pending doctors for approval
    const pendingDoctorsList = await Doctor.find({ approved: false })
      .sort({ createdAt: -1 });

    // Get all doctors for management
    const allDoctors = await Doctor.find()
      .sort({ createdAt: -1 });

    const dashboardData = {
      statistics: {
        totalUsers,
        totalDoctors,
        activeDoctors,
        pendingDoctors,
        totalAppointments,
        completedAppointments,
        todayAppointments,
        successRate
      },
      recentAppointments,
      pendingDoctors: pendingDoctorsList,
      allDoctors
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('❌ Error fetching admin dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// @route   POST /api/admin/doctors/:doctorId/approve
// @desc    Approve doctor application and send email with access link
// @access  Admin only
router.post('/doctors/:doctorId/approve', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { welcomeMessage } = req.body;

    // Find the doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (doctor.approved) {
      return res.status(400).json({ error: 'Doctor is already approved' });
    }

    // Generate unique access link for the doctor
    const { uniqueToken, accessLink } = emailService.generateDoctorAccessLink(doctorId);

    // Update doctor status
    doctor.approved = true;
    doctor.status = 'active';
    doctor.uniqueAccessLink = uniqueToken;
    doctor.approvedAt = new Date();
    doctor.approvedBy = req.user.id;

    await doctor.save();

    // Send approval email with access link
    try {
      await emailService.sendDoctorApprovalEmail(doctor, accessLink);
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError.message);
      // Don't fail the approval if email fails
    }

    res.json({
      success: true,
      message: 'Doctor approved successfully and email sent',
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        status: doctor.status,
        approved: doctor.approved,
        accessLink
      }
    });
  } catch (error) {
    console.error('❌ Error approving doctor:', error);
    res.status(500).json({ error: 'Failed to approve doctor' });
  }
});

// @route   POST /api/admin/doctors/:doctorId/reject
// @desc    Reject doctor application and send notification email
// @access  Admin only
router.post('/doctors/:doctorId/reject', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { reason } = req.body;

    // Find the doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Update doctor status
    doctor.approved = false;
    doctor.status = 'rejected';
    doctor.rejectionReason = reason || 'Application did not meet current requirements';
    doctor.rejectedAt = new Date();
    doctor.rejectedBy = req.user.id;

    await doctor.save();

    // Send rejection email
    await emailService.sendDoctorRejectionEmail(doctor, reason);

    res.json({
      success: true,
      message: 'Doctor application rejected and email sent',
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        status: doctor.status,
        approved: doctor.approved
      }
    });
  } catch (error) {
    console.error('❌ Error rejecting doctor:', error);
    res.status(500).json({ error: 'Failed to reject doctor' });
  }
});

// @route   POST /api/admin/doctors/:doctorId/deactivate
// @desc    Deactivate an active doctor
// @access  Admin only
router.post('/doctors/:doctorId/deactivate', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { reason } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    doctor.status = 'inactive';
    doctor.deactivatedAt = new Date();
    doctor.deactivationReason = reason;
    doctor.deactivatedBy = req.user.id;

    await doctor.save();

    res.json({
      success: true,
      message: 'Doctor deactivated successfully',
      doctor: {
        id: doctor._id,
        name: doctor.name,
        status: doctor.status
      }
    });
  } catch (error) {
    console.error('❌ Error deactivating doctor:', error);
    res.status(500).json({ error: 'Failed to deactivate doctor' });
  }
});

// @route   GET /api/admin/appointments
// @desc    Get all appointments with filtering options
// @access  Admin only
router.get('/appointments', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, doctorId, fromDate, toDate } = req.query;
    
    let filter = {};
    
    if (status) filter.status = status;
    if (doctorId) filter.doctor = doctorId;
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = fromDate;
      if (toDate) filter.date.$lte = toDate;
    }

    const appointments = await Appointment.find(filter)
      .populate('doctor', 'name specialization email phone')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalAppointments = await Appointment.countDocuments(filter);

    res.json({
      appointments,
      totalPages: Math.ceil(totalAppointments / limit),
      currentPage: parseInt(page),
      totalAppointments
    });
  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// @route   DELETE /api/admin-new/doctors/:doctorId/remove
// @desc    Permanently remove a doctor and invalidate access
// @access  Admin only
router.delete('/doctors/:doctorId/remove', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { reason } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Send removal email before deleting
    await emailService.sendDoctorRemovalEmail(doctor, reason || 'Administrative decision');

    // Permanently delete the doctor record (this invalidates the access link)
    await Doctor.findByIdAndDelete(doctorId);

    res.json({
      success: true,
      message: 'Doctor removed successfully and notification email sent',
      doctor: {
        id: doctorId,
        name: doctor.name,
        email: doctor.email
      }
    });
  } catch (error) {
    console.error('❌ Error removing doctor:', error);
    res.status(500).json({ error: 'Failed to remove doctor' });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get platform analytics and insights
// @access  Admin only
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(period));

    // Get user growth analytics
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          newUsers: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Get appointment trends
    const appointmentTrends = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    const analytics = {
      userGrowth,
      appointmentTrends,
      period: parseInt(period)
    };

    res.json(analytics);
  } catch (error) {
    console.error('❌ Error fetching platform analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Legacy routes (keeping for backward compatibility)

// @route   GET /api/admin/dashboard-stats
// @desc    Get admin dashboard statistics (legacy)
// @access  Private (Owner/Admin only)
router.get('/dashboard-stats', async (req, res) => {
  try {
    const stats = {
      users: {
        total: await User.countDocuments({ role: 'user' }),
        new_this_month: await User.countDocuments({
          role: 'user',
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        })
      },
      
      doctors: {
        total: await Doctor.countDocuments({ approved: true }),
        pending: await Doctor.countDocuments({ approved: false }),
        active: await Doctor.countDocuments({ approved: true, status: 'active' })
      },
      
      appointments: {
        total: await Appointment.countDocuments(),
        today: await Appointment.countDocuments({
          date: new Date().toISOString().split('T')[0]
        }),
        completed: await Appointment.countDocuments({ status: 'completed' })
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// @route   GET /api/admin/pending-doctors
// @desc    Get pending doctor applications
// @access  Private (Owner/Admin only)
router.get('/pending-doctors', async (req, res) => {
  try {
    const pendingDoctors = await Doctor.find({ approved: false })
      .sort({ createdAt: -1 });
    
    res.json(pendingDoctors);
  } catch (error) {
    console.error('Error fetching pending doctors:', error);
    res.status(500).json({ message: 'Failed to fetch pending doctors' });
  }
});

module.exports = router;
