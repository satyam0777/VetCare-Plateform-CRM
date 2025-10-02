const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { auth } = require('../middleware/authMiddleware');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret'
});

// @route   POST /api/payments/create-order
// @desc    Create Razorpay order for completed consultation payment
// @access  Private
router.post('/create-order', auth, async (req, res) => {
  try {
    const { appointmentId } = req.body;

    // Validate appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctor', 'name specialization email')
      .populate('user', 'name email mobile');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify user owns this appointment
    if (appointment.user._id.toString() !== req.user.toString()) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Check if appointment is ready for payment (consultation completed)
    if (appointment.status !== 'report_ready') {
      return res.status(400).json({ 
        error: 'Consultation not completed yet. Please wait for doctor to finish and provide the report.',
        currentStatus: appointment.status
      });
    }

    // Check if payment already completed
    if (appointment.payment?.status === 'completed') {
      return res.status(400).json({ error: 'Payment already completed for this appointment' });
    }

    // Get consultation fee (set by doctor during completion)
    const consultationFee = appointment.payment?.consultationFee || 500;
    const platformFee = appointment.payment?.platformFee || Math.round(consultationFee * 0.15);
    const totalAmount = appointment.payment?.totalAmount || (consultationFee + platformFee);

    // Create Razorpay order
    const options = {
      amount: totalAmount * 100, // Convert to paise
      currency: 'INR',
      receipt: `appointment_${appointmentId}_${Date.now()}`,
      payment_capture: 1,
      notes: {
        appointmentId: appointmentId,
        doctorName: appointment.doctor.name,
        patientName: appointment.user.name,
        petName: appointment.petName || 'Pet',
        consultationFee: consultationFee,
        platformFee: platformFee
      }
    };

    const order = await razorpay.orders.create(options);

    // Update appointment with payment order details
    appointment.payment = {
      ...appointment.payment,
      razorpayOrderId: order.id,
      status: 'pending',
      orderCreatedAt: new Date()
    };
    await appointment.save();

    res.json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      patientDetails: {
        name: appointment.user.name,
        email: appointment.user.email,
        phone: appointment.user.mobile
      },
      doctorDetails: {
        name: appointment.doctor.name,
        specialization: appointment.doctor.specialization
      },
      appointmentDetails: {
        petName: appointment.petName,
        date: appointment.date,
        time: appointment.time,
        consultationFee,
        platformFee,
        totalAmount
      }
    });

  } catch (error) {
    console.error('❌ Error creating payment order:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// @route   POST /api/payments/verify
// @desc    Verify payment and complete the consultation payment flow
// @access  Private
router.post('/verify', auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      appointmentId
    } = req.body;

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment verification failed' 
      });
    }

    // Get appointment with full details
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctor', 'name email specialization')
      .populate('user', 'name email mobile');
      
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify the order ID matches
    if (appointment.payment.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ error: 'Order ID mismatch' });
    }

    // Update appointment payment status
    const consultationFee = appointment.payment.consultationFee;
    const platformFee = appointment.payment.platformFee;
    const doctorEarnings = consultationFee; // Doctor gets the consultation fee
    
    appointment.payment = {
      ...appointment.payment,
      razorpayPaymentId: razorpay_payment_id,
      status: 'completed',
      paidAt: new Date(),
      verifiedAt: new Date()
    };
    
    // Now appointment is fully completed
    appointment.status = 'completed';
    await appointment.save();

    // Update doctor earnings
    const doctor = await Doctor.findById(appointment.doctor._id);
    if (doctor) {
      if (!doctor.earnings) {
        doctor.earnings = {
          total: 0,
          thisMonth: 0,
          platformFee: 0,
          lastUpdated: new Date()
        };
      }
      
      doctor.earnings.total += doctorEarnings;
      doctor.earnings.thisMonth += doctorEarnings;
      doctor.earnings.platformFeeDeducted = (doctor.earnings.platformFeeDeducted || 0) + platformFee;
      doctor.earnings.lastUpdated = new Date();
      
      // Update consultation count
      doctor.completedConsultations = (doctor.completedConsultations || 0) + 1;
      
      await doctor.save();
      console.log(`💰 Updated doctor earnings: +₹${doctorEarnings} (Platform fee: ₹${platformFee})`);
    }

    // Send notifications about successful payment
    try {
      const NotificationService = require('../services/notificationService');
      
      // Notify user about successful payment
      await NotificationService.sendNotification(appointment.user._id, {
        title: '✅ Payment Successful!',
        body: `Payment of ₹${appointment.payment.totalAmount} completed successfully. Your consultation with Dr. ${appointment.doctor.name} is now fully complete.`,
        type: 'payment_success',
        data: {
          appointmentId: appointment._id.toString(),
          doctorName: appointment.doctor.name,
          amount: appointment.payment.totalAmount,
          paymentId: razorpay_payment_id
        }
      });

      // Notify doctor about payment received
      const doctorUser = await User.findOne({ email: appointment.doctor.email });
      if (doctorUser) {
        await NotificationService.sendNotification(doctorUser._id, {
          title: '💰 Payment Received!',
          body: `You've received ₹${doctorEarnings} for consultation with ${appointment.user.name} (${appointment.petName}). Platform fee: ₹${platformFee}`,
          type: 'payment_received',
          data: {
            appointmentId: appointment._id.toString(),
            patientName: appointment.user.name,
            petName: appointment.petName,
            earnings: doctorEarnings,
            platformFee: platformFee,
            paymentId: razorpay_payment_id
          }
        });
      }
      
      console.log(`✅ Payment notifications sent to both user and doctor`);
    } catch (notifError) {
      console.log(`⚠️ Failed to send payment notifications:`, notifError.message);
    }

    // Send confirmation email
    try {
      const emailService = require('../services/emailService');
      
      // Send payment confirmation to user
      await emailService.sendPaymentConfirmationEmail({
        to: appointment.user.email,
        userName: appointment.user.name,
        doctorName: appointment.doctor.name,
        petName: appointment.petName,
        amount: appointment.payment.totalAmount,
        consultationFee,
        platformFee,
        paymentId: razorpay_payment_id,
        appointmentDate: appointment.date,
        appointmentTime: appointment.time
      });
      
      console.log(`✅ Payment confirmation email sent to user`);
    } catch (emailError) {
      console.error('❌ Failed to send confirmation email:', emailError.message);
    }

    res.json({
      success: true,
      message: 'Payment verified successfully! Consultation completed.',
      payment: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: appointment.payment.totalAmount,
        consultationFee,
        platformFee,
        status: 'completed',
        paidAt: appointment.payment.paidAt
      },
      appointment: {
        id: appointment._id,
        status: appointment.status,
        doctorName: appointment.doctor.name,
        petName: appointment.petName,
        reportReady: true
      },
      earnings: {
        doctorReceived: doctorEarnings,
        platformFee: platformFee,
        totalPaid: appointment.payment.totalAmount
      }
    });

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// @route   GET /api/payments/history/:userId
// @desc    Get payment history for user
// @access  Private
router.get('/history/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Verify user can access this data
    if (userId !== req.user.toString()) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const payments = await Appointment.find({
      user: userId,
      'payment.status': 'completed'
    })
    .populate('doctor', 'name specialization')
    .sort({ 'payment.paidAt': -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Appointment.countDocuments({
      user: userId,
      'payment.status': 'completed'
    });

    res.json({
      payments: payments.map(appointment => ({
        id: appointment._id,
        amount: appointment.payment.amount,
        currency: appointment.payment.currency,
        status: appointment.payment.status,
        paidAt: appointment.payment.paidAt,
        paymentId: appointment.payment.paymentId,
        doctor: appointment.doctor,
        petName: appointment.petName,
        date: appointment.date,
        time: appointment.time
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPayments: total,
        hasMore: page * limit < total
      }
    });

  } catch (error) {
    console.error('❌ Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// @route   POST /api/payments/refund
// @desc    Process refund for cancelled appointment
// @access  Private (Admin only)
router.post('/refund', auth, async (req, res) => {
  try {
    const { appointmentId, reason } = req.body;

    // Check admin permissions
    const user = await User.findById(req.user);
    if (user.role !== 'admin' && user.role !== 'owner') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || appointment.payment.status !== 'completed') {
      return res.status(400).json({ error: 'Invalid appointment for refund' });
    }

    // Process refund with Razorpay
    const refund = await razorpay.payments.refund(appointment.payment.paymentId, {
      amount: appointment.payment.amount * 100, // Convert to paise
      notes: {
        reason: reason,
        appointmentId: appointmentId
      }
    });

    // Update appointment
    appointment.payment.refundId = refund.id;
    appointment.payment.refundStatus = 'processed';
    appointment.payment.refundAmount = appointment.payment.amount;
    appointment.payment.refundedAt = new Date();
    appointment.status = 'cancelled';
    await appointment.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      }
    });

  } catch (error) {
    console.error('❌ Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// @route   GET /api/payments/analytics
// @desc    Get payment analytics for admin
// @access  Private (Admin only)
router.get('/analytics', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (user.role !== 'admin' && user.role !== 'owner') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { period = '30' } = req.query;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(period));

    // Revenue analytics
    const revenueData = await Appointment.aggregate([
      {
        $match: {
          'payment.status': 'completed',
          'payment.paidAt': { $gte: fromDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$payment.paidAt' } }
          },
          totalRevenue: { $sum: '$payment.amount' },
          platformFee: { $sum: { $multiply: ['$payment.amount', 0.15] } },
          doctorEarnings: { $sum: { $multiply: ['$payment.amount', 0.85] } },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Top performing doctors by revenue
    const topDoctors = await Appointment.aggregate([
      {
        $match: {
          'payment.status': 'completed',
          'payment.paidAt': { $gte: fromDate }
        }
      },
      {
        $group: {
          _id: '$doctor',
          totalEarnings: { $sum: { $multiply: ['$payment.amount', 0.85] } },
          appointmentCount: { $sum: 1 },
          averageAmount: { $avg: '$payment.amount' }
        }
      },
      { $sort: { totalEarnings: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      { $unwind: '$doctor' }
    ]);

    res.json({
      period: parseInt(period),
      revenue: revenueData,
      topDoctors,
      summary: {
        totalRevenue: revenueData.reduce((sum, day) => sum + day.totalRevenue, 0),
        totalTransactions: revenueData.reduce((sum, day) => sum + day.transactionCount, 0),
        averageTransaction: revenueData.length > 0 
          ? revenueData.reduce((sum, day) => sum + day.totalRevenue, 0) / revenueData.reduce((sum, day) => sum + day.transactionCount, 0)
          : 0
      }
    });

  } catch (error) {
    console.error('❌ Error fetching payment analytics:', error);
    res.status(500).json({ error: 'Failed to fetch payment analytics' });
  }
});

module.exports = router;

module.exports = router;