const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const emailService = require('../services/emailService');

class AdminController {
  // Get admin dashboard data with real statistics
  async getDashboardData(req, res) {
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

      // Get monthly appointment trends (last 6 months)
      const monthlyTrends = await this.getMonthlyAppointmentTrends();

      // Get top performing doctors
      const topDoctors = await this.getTopPerformingDoctors();

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
        allDoctors,
        monthlyTrends,
        topDoctors
      };

      res.json(dashboardData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }

  // Approve doctor application
  async approveDoctor(req, res) {
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
      doctor.approvedBy = req.user.id; // Assuming admin user ID is in req.user

      await doctor.save();

      // Send approval email with access link
      await emailService.sendDoctorApprovalEmail(doctor, accessLink);

      // Log the approval action
      console.log(`✅ Doctor ${doctor.name} (${doctor.email}) approved by admin ${req.user.id}`);

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
      console.error(error);
      res.status(500).json({ error: 'Failed to approve doctor' });
    }
  }

  // Reject doctor application
  async rejectDoctor(req, res) {
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

      // Log the rejection action
      console.log(`❌ Doctor ${doctor.name} (${doctor.email}) rejected by admin ${req.user.id}`);

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
      console.error(error);
      res.status(500).json({ error: 'Failed to reject doctor' });
    }
  }

  // Deactivate doctor
  async deactivateDoctor(req, res) {
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

      // Send removal/deactivation email to doctor
      await emailService.sendDoctorRemovalEmail(doctor, reason);

      res.json({
        success: true,
        message: 'Doctor deactivated successfully and email sent',
        doctor: {
          id: doctor._id,
          name: doctor.name,
          status: doctor.status
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to deactivate doctor' });
    }
  }

  // Get all appointments with filtering
  async getAllAppointments(req, res) {
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
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  }

  // Get monthly appointment trends
  async getMonthlyAppointmentTrends() {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const trends = await Appointment.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      return trends;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  // Get top performing doctors
  async getTopPerformingDoctors() {
    try {
      const topDoctors = await Appointment.aggregate([
        {
          $match: {
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$doctor',
            appointmentsCompleted: { $sum: 1 },
            averageRating: { $avg: '$rating' }
          }
        },
        {
          $lookup: {
            from: 'doctors',
            localField: '_id',
            foreignField: '_id',
            as: 'doctorInfo'
          }
        },
        {
          $unwind: '$doctorInfo'
        },
        {
          $project: {
            name: '$doctorInfo.name',
            specialization: '$doctorInfo.specialization',
            appointmentsCompleted: 1,
            averageRating: { $round: ['$averageRating', 1] }
          }
        },
        {
          $sort: { appointmentsCompleted: -1 }
        },
        {
          $limit: 10
        }
      ]);

      return topDoctors;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  // Get platform analytics
  async getPlatformAnalytics(req, res) {
    try {
      const { period = '30' } = req.query; // days
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - parseInt(period));

      const analytics = {
        userGrowth: await this.getUserGrowthAnalytics(fromDate),
        appointmentTrends: await this.getAppointmentTrends(fromDate),
        doctorPerformance: await this.getDoctorPerformanceAnalytics(),
        revenueAnalytics: await this.getRevenueAnalytics(fromDate)
      };

      res.json(analytics);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }

  // Get user growth analytics
  async getUserGrowthAnalytics(fromDate) {
    try {
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

      return userGrowth;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  // Get appointment trends
  async getAppointmentTrends(fromDate) {
    try {
      const trends = await Appointment.aggregate([
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

      return trends;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  // Get doctor performance analytics
  async getDoctorPerformanceAnalytics() {
    try {
      const performance = await Doctor.aggregate([
        {
          $lookup: {
            from: 'appointments',
            localField: '_id',
            foreignField: 'doctor',
            as: 'appointments'
          }
        },
        {
          $project: {
            name: 1,
            specialization: 1,
            totalAppointments: { $size: '$appointments' },
            completedAppointments: {
              $size: {
                $filter: {
                  input: '$appointments',
                  cond: { $eq: ['$$this.status', 'completed'] }
                }
              }
            },
            averageRating: {
              $avg: {
                $map: {
                  input: {
                    $filter: {
                      input: '$appointments',
                      cond: { $ne: ['$$this.rating', null] }
                    }
                  },
                  as: 'appointment',
                  in: '$$appointment.rating'
                }
              }
            }
          }
        },
        {
          $addFields: {
            completionRate: {
              $cond: [
                { $gt: ['$totalAppointments', 0] },
                { $multiply: [{ $divide: ['$completedAppointments', '$totalAppointments'] }, 100] },
                0
              ]
            }
          }
        },
        {
          $sort: { totalAppointments: -1 }
        }
      ]);

      return performance;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  // Get revenue analytics (mock data for now)
  async getRevenueAnalytics(fromDate) {
    try {
      // This would typically integrate with your payment system
      // For now, returning mock data based on completed appointments
      const completedAppointments = await Appointment.countDocuments({
        status: 'completed',
        createdAt: { $gte: fromDate }
      });

      const estimatedRevenue = completedAppointments * 50; // $50 per appointment
      const platformFee = estimatedRevenue * 0.15; // 15% platform fee

      return {
        totalRevenue: estimatedRevenue,
        platformFee,
        doctorEarnings: estimatedRevenue - platformFee,
        completedAppointments
      };
    } catch (error) {
      console.error(error);
      return {
        totalRevenue: 0,
        platformFee: 0,
        doctorEarnings: 0,
        completedAppointments: 0
      };
    }
  }
}

module.exports = new AdminController();