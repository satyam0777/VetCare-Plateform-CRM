// ...existing code...
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { auth } = require('../middleware/authMiddleware');
const emailService = require('../services/emailService');
const Admin = require('../models/Admin');

// Middleware to check if user is admin
const adminMiddleware = (req, res, next) => {
  // Debug log for troubleshooting admin access
  console.log('🔒 [adminMiddleware] req.user:', req.user);
  console.log('🔒 [adminMiddleware] req.userRole:', req.userRole);
  if (
    (req.user && req.user.role === 'admin') ||
    (req.user && req.user.role === 'owner') ||
    (req.userRole === 'admin') ||
    (req.userRole === 'owner')
  ) {
    next();
  } else {
    console.log('❌ [adminMiddleware] Access denied. User is not admin/owner.');
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

    // Revenue analytics (reuse logic from /revenue-analytics)
    const all = await Appointment.find({ status: 'completed' });
    const sumField = (arr, field) => arr.reduce((sum, a) => sum + (a[field] || 0), 0);
    const totalRevenue = sumField(all.map(a => a.payment || {}), 'totalAmount');
    const totalCommission = sumField(all.map(a => a.payment || {}), 'platformCommission');
    const totalDoctorEarnings = sumField(all.map(a => a.payment || {}), 'doctorEarnings');

    const dashboardData = {
      statistics: {
        totalUsers,
        totalDoctors,
        activeDoctors,
        pendingDoctors,
        totalAppointments,
        completedAppointments,
        todayAppointments,
        successRate,
        totalRevenue,
        totalCommission,
        totalDoctorEarnings
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
    // Real dynamic stats for admin dashboard
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalDoctors = await Doctor.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    // Revenue analytics
    const all = await Appointment.find({ status: 'completed' });
    const sumField = (arr, field) => arr.reduce((sum, a) => sum + (a[field] || 0), 0);
    const totalRevenue = sumField(all.map(a => a.payment || {}), 'totalAmount');
    const totalCommission = sumField(all.map(a => a.payment || {}), 'platformCommission');
    const totalDoctorEarnings = sumField(all.map(a => a.payment || {}), 'doctorEarnings');
    res.json({
      totalUsers,
      totalDoctors,
      totalAppointments,
      totalRevenue,
      totalCommission,
      totalDoctorEarnings
    });
  } catch (error) {
    console.error('❌ Error fetching platform analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// @route   GET /api/admin/revenue-analytics
// @desc    Get platform and doctor revenue/earnings analytics
// @access  Admin only
router.get('/revenue-analytics', async (req, res) => {
  try {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Helper for sums
    const sumField = (arr, field) => arr.reduce((sum, a) => sum + (a[field] || 0), 0);

    // All completed appointments
    const all = await Appointment.find({ status: 'completed' });
    // This month
    const thisMonth = await Appointment.find({ status: 'completed', createdAt: { $gte: firstDayThisMonth } });
    // Last month
    const lastMonth = await Appointment.find({ status: 'completed', createdAt: { $gte: firstDayLastMonth, $lt: firstDayThisMonth } });

    // Revenue/commission/earnings
    const totalRevenue = sumField(all.map(a => a.payment || {}), 'totalAmount');
    const totalCommission = sumField(all.map(a => a.payment || {}), 'platformCommission');
    const totalDoctorEarnings = sumField(all.map(a => a.payment || {}), 'doctorEarnings');

    const thisMonthRevenue = sumField(thisMonth.map(a => a.payment || {}), 'totalAmount');
    const thisMonthCommission = sumField(thisMonth.map(a => a.payment || {}), 'platformCommission');
    const thisMonthDoctorEarnings = sumField(thisMonth.map(a => a.payment || {}), 'doctorEarnings');

    const lastMonthRevenue = sumField(lastMonth.map(a => a.payment || {}), 'totalAmount');
    const lastMonthCommission = sumField(lastMonth.map(a => a.payment || {}), 'platformCommission');
    const lastMonthDoctorEarnings = sumField(lastMonth.map(a => a.payment || {}), 'doctorEarnings');

    // Top earning doctors (all time)
    const doctorEarnings = {};
    all.forEach(a => {
      if (a.doctor && a.payment && a.payment.doctorEarnings) {
        const id = a.doctor.toString();
        doctorEarnings[id] = (doctorEarnings[id] || 0) + a.payment.doctorEarnings;
      }
    });
    const doctorList = await Doctor.find({ _id: { $in: Object.keys(doctorEarnings) } });
    const topDoctors = doctorList.map(doc => ({
      _id: doc._id,
      name: doc.name,
      email: doc.email,
      earnings: doctorEarnings[doc._id.toString()] || 0,
      specialization: doc.specialization || '',
      experience: doc.experience || 0
    })).sort((a, b) => b.earnings - a.earnings).slice(0, 5);

    // Recent transactions (last 10 completed)
    const recent = await Appointment.find({ status: 'completed' })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('doctor', 'name email')
      .populate('user', 'name email');
    const recentTransactions = recent.map(a => ({
      id: a._id,
      doctor: a.doctor ? (a.doctor.name || a.doctor.email) : '',
      user: a.user ? (a.user.name || a.user.email) : '',
      amount: a.payment?.totalAmount || 0,
      commission: a.payment?.platformCommission || 0,
      doctorEarnings: a.payment?.doctorEarnings || 0,
      date: a.updatedAt,
      type: 'consultation'
    }));

    res.json({
      totalRevenue,
      totalCommission,
      totalDoctorEarnings,
      thisMonthRevenue,
      thisMonthCommission,
      thisMonthDoctorEarnings,
      lastMonthRevenue,
      lastMonthCommission,
      lastMonthDoctorEarnings,
      topDoctors,
      recentTransactions
    });
  } catch (error) {
    console.error('❌ Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
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

// @route   GET /api/admin/users
// @desc    Get all users for admin (by userIds array)
// @access  Admin only
router.get('/users', async (req, res) => {
  try {
    // For now, get the first admin (or you can use req.user if admin is logged in)
    const admin = await Admin.findOne();
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    const users = await User.find({ _id: { $in: admin.userIds } }).select('-password');
    res.json(users);
  } catch (error) {
    console.error('❌ Error fetching users for admin:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get a single user's full profile (admin only)
// @access  Admin only
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});
module.exports = router;
