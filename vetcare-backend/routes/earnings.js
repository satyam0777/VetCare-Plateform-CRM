const express = require('express');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { authMiddleware, flexibleAuth } = require('../middleware/authMiddleware');
const router = express.Router();

// Calculate earnings for a doctor
router.get('/earnings', flexibleAuth, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { period = 'month' } = req.query; // 'week', 'month', 'all'
    
    let startDate;
    const now = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get completed appointments with payments
    const appointments = await Appointment.find({
      doctorId,
      status: 'completed',
      'payment.status': 'paid',
      createdAt: { $gte: startDate }
    }).populate('userId', 'name email');

    // Calculate earnings
    let totalEarnings = 0;
    let totalConsultations = appointments.length;
    let totalCommission = 0;
    let totalRevenue = 0;

    const earningsBreakdown = appointments.map(appointment => {
      const consultationFee = appointment.payment?.consultationFee || 0;
      const commission = Math.round(consultationFee * 0.15); // 15% platform fee
      const doctorEarning = consultationFee - commission;

      totalRevenue += consultationFee;
      totalCommission += commission;
      totalEarnings += doctorEarning;

      return {
        appointmentId: appointment._id,
        date: appointment.createdAt,
        patientName: appointment.userId?.name || 'Unknown',
        consultationFee,
        platformCommission: commission,
        doctorEarning,
        status: appointment.payment?.status
      };
    });

    // Get pending payments
    const pendingAppointments = await Appointment.find({
      doctorId,
      status: 'completed',
      'payment.status': 'pending'
    });

    let pendingEarnings = 0;
    pendingAppointments.forEach(appointment => {
      const fee = appointment.payment?.consultationFee || 0;
      pendingEarnings += fee - Math.round(fee * 0.15);
    });

    res.json({
      period,
      totalEarnings,
      totalConsultations,
      totalRevenue,
      totalCommission,
      pendingEarnings,
      pendingConsultations: pendingAppointments.length,
      earningsBreakdown,
      summary: {
        averageEarningPerConsultation: totalConsultations > 0 ? Math.round(totalEarnings / totalConsultations) : 0,
        commissionRate: '15%',
        payoutSchedule: 'Weekly'
      }
    });

  } catch (error) {
    console.error('Earnings calculation error:', error);
    res.status(500).json({ message: 'Failed to calculate earnings', error: error.message });
  }
});

// Get all doctors' earnings summary (Admin only)
router.get('/admin/earnings-summary', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { period = 'month' } = req.query;
    
    let startDate;
    const now = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(0);
    }

    // Aggregate earnings by doctor
    const earningsSummary = await Appointment.aggregate([
      {
        $match: {
          status: 'completed',
          'payment.status': 'paid',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$doctorId',
          totalConsultations: { $sum: 1 },
          totalRevenue: { $sum: '$payment.consultationFee' },
          totalCommission: { $sum: { $multiply: ['$payment.consultationFee', 0.15] } },
          totalDoctorEarnings: { $sum: { $multiply: ['$payment.consultationFee', 0.85] } }
        }
      },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      {
        $unwind: '$doctor'
      },
      {
        $project: {
          doctorName: '$doctor.name',
          doctorEmail: '$doctor.email',
          specialization: '$doctor.specialization',
          totalConsultations: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          totalCommission: { $round: ['$totalCommission', 2] },
          totalDoctorEarnings: { $round: ['$totalDoctorEarnings', 2] },
          averagePerConsultation: { 
            $round: [{ $divide: ['$totalDoctorEarnings', '$totalConsultations'] }, 2] 
          }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    // Calculate platform totals
    const platformTotals = earningsSummary.reduce((acc, doctor) => ({
      totalRevenue: acc.totalRevenue + doctor.totalRevenue,
      totalCommission: acc.totalCommission + doctor.totalCommission,
      totalDoctorPayouts: acc.totalDoctorPayouts + doctor.totalDoctorEarnings,
      totalConsultations: acc.totalConsultations + doctor.totalConsultations
    }), { totalRevenue: 0, totalCommission: 0, totalDoctorPayouts: 0, totalConsultations: 0 });

    res.json({
      period,
      platformTotals,
      doctorEarnings: earningsSummary,
      summary: {
        activeDoctors: earningsSummary.length,
        averageRevenuePerDoctor: earningsSummary.length > 0 ? 
          Math.round(platformTotals.totalRevenue / earningsSummary.length) : 0,
        commissionRate: '15%'
      }
    });

  } catch (error) {
    console.error('Admin earnings summary error:', error);
    res.status(500).json({ message: 'Failed to generate earnings summary', error: error.message });
  }
});

// Process doctor payouts (Admin only)
router.post('/admin/process-payouts', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { doctorIds, payoutDate } = req.body;
    
    // Get pending earnings for specified doctors
    const pendingAppointments = await Appointment.find({
      doctorId: { $in: doctorIds },
      status: 'completed',
      'payment.status': 'paid',
      'payment.doctorPayout': { $ne: 'processed' }
    }).populate('doctorId', 'name email');

    const payoutSummary = {};
    
    // Group by doctor and calculate payouts
    pendingAppointments.forEach(appointment => {
      const doctorId = appointment.doctorId._id.toString();
      const consultationFee = appointment.payment.consultationFee;
      const doctorEarning = consultationFee - Math.round(consultationFee * 0.15);

      if (!payoutSummary[doctorId]) {
        payoutSummary[doctorId] = {
          doctorName: appointment.doctorId.name,
          doctorEmail: appointment.doctorId.email,
          totalEarnings: 0,
          consultationCount: 0,
          appointmentIds: []
        };
      }

      payoutSummary[doctorId].totalEarnings += doctorEarning;
      payoutSummary[doctorId].consultationCount += 1;
      payoutSummary[doctorId].appointmentIds.push(appointment._id);
    });

    // Mark appointments as paid out
    const appointmentIds = pendingAppointments.map(apt => apt._id);
    await Appointment.updateMany(
      { _id: { $in: appointmentIds } },
      { 
        'payment.doctorPayout': 'processed',
        'payment.payoutDate': new Date(payoutDate || Date.now())
      }
    );

    res.json({
      message: 'Payouts processed successfully',
      payoutSummary: Object.values(payoutSummary),
      totalDoctors: Object.keys(payoutSummary).length,
      totalAmount: Object.values(payoutSummary).reduce((sum, doctor) => sum + doctor.totalEarnings, 0),
      processedAppointments: appointmentIds.length,
      payoutDate: payoutDate || new Date()
    });

  } catch (error) {
    console.error('Payout processing error:', error);
    res.status(500).json({ message: 'Failed to process payouts', error: error.message });
  }
});

// Get payout history for a doctor
router.get('/payout-history', flexibleAuth, async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    const payoutHistory = await Appointment.find({
      doctorId,
      status: 'completed',
      'payment.doctorPayout': 'processed'
    })
    .select('createdAt payment.consultationFee payment.payoutDate')
    .sort({ 'payment.payoutDate': -1 });

    const history = payoutHistory.map(appointment => {
      const consultationFee = appointment.payment.consultationFee;
      const doctorEarning = consultationFee - Math.round(consultationFee * 0.15);
      
      return {
        appointmentId: appointment._id,
        consultationDate: appointment.createdAt,
        payoutDate: appointment.payment.payoutDate,
        consultationFee,
        doctorEarning,
        commission: Math.round(consultationFee * 0.15)
      };
    });

    // Group by payout date for summary
    const groupedHistory = history.reduce((acc, payout) => {
      const payoutDateKey = payout.payoutDate.toISOString().split('T')[0];
      
      if (!acc[payoutDateKey]) {
        acc[payoutDateKey] = {
          payoutDate: payout.payoutDate,
          totalEarnings: 0,
          consultationCount: 0,
          payouts: []
        };
      }
      
      acc[payoutDateKey].totalEarnings += payout.doctorEarning;
      acc[payoutDateKey].consultationCount += 1;
      acc[payoutDateKey].payouts.push(payout);
      
      return acc;
    }, {});

    res.json({
      payoutHistory: Object.values(groupedHistory),
      totalPayouts: history.length,
      totalEarnings: history.reduce((sum, payout) => sum + payout.doctorEarning, 0)
    });

  } catch (error) {
    console.error('Payout history error:', error);
    res.status(500).json({ message: 'Failed to fetch payout history', error: error.message });
  }
});

module.exports = router;