const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { auth } = require('../middleware/authMiddleware');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Report = require('../models/Report');
const Payment = require('../models/Payment');
const bankingService = require('../services/bankingService');

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

    // Check if user has pending payments that block new appointments
    const user = await User.findById(req.user);
    if (!user.paymentStatus.canBookAppointments && user.paymentStatus.hasPendingPayments) {
      return res.status(402).json({ 
        error: 'Payment required to access services',
        message: `You have unpaid consultations totaling ₹${user.paymentStatus.unpaidAmount}. Please clear pending payments to continue using our services.`,
        unpaidAmount: user.paymentStatus.unpaidAmount,
        pendingConsultations: user.paymentStatus.pendingConsultations
      });
    }

    // Validate appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctor', 'name specialization email bankDetails')
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
    const totalAmount = appointment.payment?.totalAmount || consultationFee;

    // VetCare Platform Fee Structure: 18%
    const platformFeePercentage = 18;
    const platformFee = Math.round(totalAmount * (platformFeePercentage / 100));
    const doctorPayout = totalAmount - platformFee;

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
        platformFee: platformFee,
        doctorPayout: doctorPayout
      }
    };

    const order = await razorpay.orders.create(options);

    // Create Payment record in database
    const payment = new Payment({
      orderId: order.id,
      razorpayOrderId: order.id,
      amount: totalAmount,
      userId: req.user,
      doctorId: appointment.doctor._id,
      appointmentId: appointmentId,
      consultationDetails: {
        consultationFee: consultationFee,
        description: `Consultation for ${appointment.petName} with Dr. ${appointment.doctor.name}`
      },
      financialBreakdown: {
        totalAmount: totalAmount,
        platformFee: platformFee,
        doctorPayout: doctorPayout,
        platformFeePercentage: platformFeePercentage,
        doctorPayoutPercentage: 100 - platformFeePercentage
      },
      userPaymentHistory: {
        previousUnpaidAmount: user.paymentStatus.unpaidAmount,
        isFirstPayment: user.paymentStatus.unpaidAmount === 0,
        canBookNewAppointments: true
      },
      auditLog: [{
        action: 'order_created',
        details: { orderId: order.id, amount: totalAmount },
        performedBy: 'user'
      }]
    });

    await payment.save();

    // Update appointment with payment order details
    appointment.payment = {
      ...appointment.payment,
      razorpayOrderId: order.id,
      status: 'pending',
      orderCreatedAt: new Date(),
      platformFee: platformFee,
      doctorPayout: doctorPayout
    };
    await appointment.save();

    console.log(`💳 Payment order created: ₹${totalAmount} (Platform: ₹${platformFee}, Doctor: ₹${doctorPayout})`);

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
        totalAmount
      },
      financialBreakdown: {
        totalAmount: totalAmount,
        platformFee: platformFee,
        doctorPayout: doctorPayout,
        platformPercentage: `${platformFeePercentage}%`
      }
    });

  } catch (error) {
    console.error('❌ Error creating payment order:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// @route   POST /api/payments/verify
// @desc    Verify payment and complete the consultation payment flow with platform distribution
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

    // Get payment record
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    // Mark payment as paid
    await payment.markAsPaid(razorpay_payment_id, razorpay_signature);

    // Get appointment with full details
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctor', 'name email specialization bankDetails')
      .populate('user', 'name email mobile');
      
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify the order ID matches
    if (appointment.payment.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ error: 'Order ID mismatch' });
    }

    // Financial breakdown
    const totalAmount = payment.financialBreakdown.totalAmount;
    const platformFee = payment.financialBreakdown.platformFee;
    const doctorPayout = payment.financialBreakdown.doctorPayout;
    
    // Update appointment payment status
    appointment.payment = {
      ...appointment.payment,
      razorpayPaymentId: razorpay_payment_id,
      status: 'completed',
      paidAt: new Date(),
      verifiedAt: new Date(),
      platformFee: platformFee,
      doctorPayout: doctorPayout
    };
    
    // Now appointment is fully completed
    appointment.status = 'completed';
    await appointment.save();

    // Update user payment status - CLEAR RESTRICTIONS
    const user = await User.findById(req.user);
    if (user) {
      // Remove this consultation from pending payments
      user.paymentStatus.pendingConsultations = user.paymentStatus.pendingConsultations.filter(
        pending => pending.appointmentId.toString() !== appointmentId
      );
      
      // Recalculate unpaid amount
      const remainingUnpaid = user.paymentStatus.pendingConsultations.reduce(
        (sum, pending) => sum + pending.amount, 0
      );
      
      user.paymentStatus.unpaidAmount = remainingUnpaid;
      user.paymentStatus.hasPendingPayments = remainingUnpaid > 0;
      user.paymentStatus.canBookAppointments = remainingUnpaid === 0; // Remove restrictions if no pending
      user.paymentStatus.lastPaymentDate = new Date();
      
      // Clear payment restrictions if all paid
      if (remainingUnpaid === 0) {
        user.paymentStatus.paymentRestrictions.blocked = false;
        user.paymentStatus.paymentRestrictions.blockedReason = '';
        user.paymentStatus.paymentRestrictions.minimumPaymentRequired = 0;
      }
      
      await user.save();
      console.log(`✅ User payment restrictions updated: canBook=${user.paymentStatus.canBookAppointments}`);
    }

    // Update doctor earnings and prepare for payout
    const doctor = await Doctor.findById(appointment.doctor._id);
    if (doctor) {
      // Update doctor earnings
      doctor.totalEarnings = (doctor.totalEarnings || 0) + doctorPayout;
      doctor.pendingPayouts = (doctor.pendingPayouts || 0) + doctorPayout;
      doctor.completedConsultations = (doctor.completedConsultations || 0) + 1;
      
      // Update monthly earnings
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!doctor.monthlyEarnings) {
        doctor.monthlyEarnings = new Map();
      }
      const monthlyAmount = doctor.monthlyEarnings.get(currentMonth) || 0;
      doctor.monthlyEarnings.set(currentMonth, monthlyAmount + doctorPayout);
      
      await doctor.save();
      
      console.log(`💰 Doctor earnings updated: +₹${doctorPayout} (Platform kept: ₹${platformFee})`);
      
      // Schedule doctor payout (in real-world, this would trigger a bank transfer)
      // For now, we'll mark it as pending payout
      payment.doctorPayout.status = 'pending';
      payment.doctorPayout.nextAttemptAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Next Monday
      await payment.save();
    }

    // VetCare Platform Revenue Tracking
    console.log(`🏦 VetCare Platform Revenue: +₹${platformFee} (${payment.financialBreakdown.platformFeePercentage}% of ₹${totalAmount})`);
    
    // Log to platform revenue tracking (in real app, this would update platform accounts)
    payment.auditLog.push({
      action: 'payment_completed',
      details: {
        totalAmount,
        platformRevenue: platformFee,
        doctorPayout: doctorPayout,
        paymentMethod: 'razorpay'
      },
      performedBy: 'payment_gateway'
    });
    await payment.save();

    // Send notifications about successful payment
    try {
      const NotificationService = require('../services/notificationService');
      
      // Notify user about successful payment and access restored
      await NotificationService.sendNotification(appointment.user._id, {
        title: '✅ Payment Successful!',
        body: `Payment of ₹${totalAmount} completed successfully. Your consultation with Dr. ${appointment.doctor.name} is now complete and all services are available.`,
        type: 'payment_success',
        data: {
          appointmentId: appointment._id.toString(),
          doctorName: appointment.doctor.name,
          amount: totalAmount,
          paymentId: razorpay_payment_id,
          accessRestored: user.paymentStatus.canBookAppointments
        }
      });

      // Notify doctor about earnings and payout schedule
      const doctorUser = await User.findOne({ email: appointment.doctor.email });
      if (doctorUser) {
        await NotificationService.sendNotification(doctorUser._id, {
          title: '💰 Payment Received!',
          body: `You've earned ₹${doctorPayout} for consultation with ${appointment.user.name} (${appointment.petName}). Payout will be processed on next Monday. Platform fee: ₹${platformFee}`,
          type: 'payment_received',
          data: {
            appointmentId: appointment._id.toString(),
            patientName: appointment.user.name,
            petName: appointment.petName,
            earnings: doctorPayout,
            platformFee: platformFee,
            payoutSchedule: 'Next Monday',
            paymentId: razorpay_payment_id
          }
        });
      }
      
      console.log(`✅ Payment notifications sent to both user and doctor`);
    } catch (notifError) {
      console.log(`⚠️ Failed to send payment notifications:`, notifError.message);
    }

    res.json({
      success: true,
      message: 'Payment verified successfully! Consultation completed.',
      payment: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: totalAmount,
        status: 'completed',
        paidAt: appointment.payment.paidAt
      },
      financialBreakdown: {
        totalPaid: totalAmount,
        platformFee: platformFee,
        doctorEarnings: doctorPayout,
        platformPercentage: `${payment.financialBreakdown.platformFeePercentage}%`,
        doctorPercentage: `${payment.financialBreakdown.doctorPayoutPercentage}%`
      },
      appointment: {
        id: appointment._id,
        status: appointment.status,
        doctorName: appointment.doctor.name,
        petName: appointment.petName,
        reportReady: true
      },
      userStatus: {
        canBookAppointments: user.paymentStatus.canBookAppointments,
        pendingPayments: user.paymentStatus.unpaidAmount,
        accessRestored: user.paymentStatus.unpaidAmount === 0
      }
    });

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// @route   GET /api/payments/user/status
// @desc    Check user payment status and restrictions
// @access  Private
router.get('/user/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user)
      .select('paymentStatus activity.totalSpent')
      .populate('paymentStatus.pendingConsultations.appointmentId', 'petName date doctor')
      .populate('paymentStatus.pendingConsultations.doctorId', 'name specialization');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const canBook = user.paymentStatus.canBookAppointments && !user.paymentStatus.paymentRestrictions.blocked;
    
    res.json({
      canBookAppointments: canBook,
      paymentStatus: {
        hasPendingPayments: user.paymentStatus.hasPendingPayments,
        unpaidAmount: user.paymentStatus.unpaidAmount,
        lastPaymentDate: user.paymentStatus.lastPaymentDate,
        totalSpent: user.activity?.totalSpent || 0
      },
      restrictions: user.paymentStatus.paymentRestrictions,
      pendingConsultations: user.paymentStatus.pendingConsultations.map(consultation => ({
        appointmentId: consultation.appointmentId._id,
        doctorName: consultation.doctorId.name,
        petName: consultation.appointmentId.petName,
        amount: consultation.amount,
        dueDate: consultation.dueDate,
        consultationDate: consultation.consultationDate,
        status: consultation.status
      })),
      message: canBook 
        ? 'Account in good standing - you can book new appointments' 
        : `Payment required: ₹${user.paymentStatus.unpaidAmount} pending from previous consultations`
    });

  } catch (error) {
    console.error('❌ Error fetching user payment status:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

// @route   GET /api/payments/doctor/earnings/:doctorId
// @desc    Get doctor earnings and payout status
// @access  Private (Doctor or Admin)
router.get('/doctor/earnings/:doctorId', auth, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { period = '30' } = req.query;

    // Check permissions (doctor can view own, admin can view all)
    const doctor = await Doctor.findById(doctorId).populate('user', 'role');
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const user = await User.findById(req.user);
    if (user.role !== 'admin' && doctor.user?._id.toString() !== req.user.toString()) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(period));

    // Get earnings from payments
    const earningsData = await Payment.getDoctorEarnings(doctorId, fromDate, new Date());
    
    // Get pending payouts
    const pendingPayouts = await Payment.find({
      doctorId: doctorId,
      'doctorPayout.status': 'pending'
    }).select('financialBreakdown.doctorPayout createdAt doctorPayout.nextAttemptAt');

    // Get processed payouts
    const processedPayouts = await Payment.find({
      doctorId: doctorId,
      'doctorPayout.status': 'processed',
      'doctorPayout.processedAt': { $gte: fromDate }
    }).select('financialBreakdown.doctorPayout doctorPayout.processedAt doctorPayout.payoutId');

    const totalPendingPayout = pendingPayouts.reduce(
      (sum, payment) => sum + payment.financialBreakdown.doctorPayout, 0
    );

    res.json({
      doctorId: doctorId,
      bankDetails: {
        verified: doctor.bankDetails?.verified || false,
        hasDetails: !!(doctor.bankDetails?.accountNumber && doctor.bankDetails?.ifscCode)
      },
      earnings: {
        totalEarnings: earningsData[0]?.totalEarnings || 0,
        pendingPayout: totalPendingPayout,
        consultationsCompleted: earningsData[0]?.totalConsultations || 0,
        averagePerConsultation: earningsData[0]?.totalConsultations > 0 
          ? Math.round((earningsData[0]?.totalEarnings || 0) / earningsData[0]?.totalConsultations) 
          : 0
      },
      payouts: {
        pending: pendingPayouts.map(p => ({
          amount: p.financialBreakdown.doctorPayout,
          scheduledFor: p.doctorPayout.nextAttemptAt,
          consultationDate: p.createdAt
        })),
        processed: processedPayouts.map(p => ({
          amount: p.financialBreakdown.doctorPayout,
          processedAt: p.doctorPayout.processedAt,
          payoutId: p.doctorPayout.payoutId
        }))
      },
      platformInfo: {
        commissionRate: '18%',
        payoutSchedule: 'Every Monday',
        minimumPayout: 500,
        currency: 'INR'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching doctor earnings:', error);
    res.status(500).json({ error: 'Failed to fetch earnings data' });
  }
});

// @route   POST /api/payments/admin/process-payouts
// @desc    Process pending doctor payouts (Admin only)
// @access  Private (Admin only)
router.post('/admin/process-payouts', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (user.role !== 'admin' && user.role !== 'owner') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { doctorIds } = req.body; // Optional: specific doctors, or all if empty

    let query = { 'doctorPayout.status': 'pending' };
    if (doctorIds && doctorIds.length > 0) {
      query.doctorId = { $in: doctorIds };
    }

    const pendingPayouts = await Payment.find(query)
      .populate('doctorId', 'name bankDetails email')
      .select('doctorId financialBreakdown.doctorPayout');

    const payoutResults = [];
    
    for (const payment of pendingPayouts) {
      try {
        // Check if doctor has verified bank details
        if (!payment.doctorId.bankDetails?.verified) {
          payoutResults.push({
            doctorId: payment.doctorId._id,
            doctorName: payment.doctorId.name,
            status: 'failed',
            reason: 'Bank details not verified',
            amount: payment.financialBreakdown.doctorPayout
          });
          continue;
        }

        // Real bank transfer using banking service
        const transferResult = await bankingService.transferToDoctor(
          payment.doctorId.bankDetails,
          payment.financialBreakdown.doctorPayout,
          `CONSULTATION_PAYOUT_${payment._id}`
        );

        if (transferResult.success) {
          // Mark payout as processed with bank transfer details
          await payment.processDoctorPayout(transferResult.transactionId);
          
          // Update doctor's total earnings
          await Doctor.findByIdAndUpdate(payment.doctorId._id, {
            $inc: { 
              pendingPayouts: -payment.financialBreakdown.doctorPayout,
              totalPayouts: payment.financialBreakdown.doctorPayout 
            }
          });

          payoutResults.push({
            doctorId: payment.doctorId._id,
            doctorName: payment.doctorId.name,
            status: 'processed',
            amount: payment.financialBreakdown.doctorPayout,
            transactionId: transferResult.transactionId,
            bankReference: transferResult.bankReference,
            transferDate: transferResult.transferDate
          });

          console.log(`💰 Payout processed: ₹${payment.financialBreakdown.doctorPayout} to Dr. ${payment.doctorId.name}`);
          console.log(`   Transaction ID: ${transferResult.transactionId}`);
          console.log(`   Bank Reference: ${transferResult.bankReference}`);
        } else {
          payoutResults.push({
            doctorId: payment.doctorId._id,
            doctorName: payment.doctorId.name,
            status: 'failed',
            reason: transferResult.error,
            amount: payment.financialBreakdown.doctorPayout
          });

        }
      } catch (error) {
        payoutResults.push({
          doctorId: payment.doctorId._id,
          doctorName: payment.doctorId.name,
          status: 'failed',
          reason: error.message,
          amount: payment.financialBreakdown.doctorPayout
        });
      }
    }

    const summary = {
      totalProcessed: payoutResults.filter(r => r.status === 'processed').length,
      totalFailed: payoutResults.filter(r => r.status === 'failed').length,
      totalAmount: payoutResults
        .filter(r => r.status === 'processed')
        .reduce((sum, r) => sum + r.amount, 0)
    };

    res.json({
      success: true,
      message: `Processed ${summary.totalProcessed} payouts, ${summary.totalFailed} failed`,
      summary,
      results: payoutResults
    });

  } catch (error) {
    console.error('❌ Error processing payouts:', error);
    res.status(500).json({ error: 'Failed to process payouts' });
  }
});

// @route   GET /api/payments/admin/platform-revenue
// @desc    Get platform revenue analytics (Admin only)
// @access  Private (Admin only)
router.get('/admin/platform-revenue', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (user.role !== 'admin' && user.role !== 'owner') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { period = '30' } = req.query;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(period));

    // Get platform revenue
    const revenueData = await Payment.getPlatformRevenue(fromDate, new Date());
    
    // Get daily revenue breakdown
    const dailyRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'paid',
          paidAt: { $gte: fromDate, $lte: new Date() }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } }
          },
          platformRevenue: { $sum: '$financialBreakdown.platformFee' },
          doctorPayouts: { $sum: '$financialBreakdown.doctorPayout' },
          totalTransactions: { $sum: 1 },
          totalVolume: { $sum: '$financialBreakdown.totalAmount' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // VetCare platform bank details from environment
    const platformBankInfo = {
      accountNumber: process.env.VETCARE_BANK_ACCOUNT || 'Not configured',
      ifscCode: process.env.VETCARE_BANK_IFSC || 'Not configured',
      accountHolderName: process.env.VETCARE_BANK_HOLDER_NAME || 'VetCare Platform Pvt Ltd',
      bankName: process.env.VETCARE_BANK_NAME || 'Not configured'
    };

    res.json({
      period: parseInt(period),
      platformBankDetails: platformBankInfo,
      revenue: {
        totalRevenue: revenueData[0]?.totalRevenue || 0,
        totalTransactions: revenueData[0]?.totalPayments || 0,
        totalVolume: revenueData[0]?.totalTransactionValue || 0,
        averageCommission: revenueData[0]?.totalPayments > 0 
          ? Math.round((revenueData[0]?.totalRevenue || 0) / revenueData[0]?.totalPayments) 
          : 0
      },
      dailyBreakdown: dailyRevenue,
      settings: {
        platformCommissionRate: '18%',
        doctorPayoutRate: '82%',
        paymentGatewayFee: '2.4%',
        payoutSchedule: 'Weekly (Mondays)'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching platform revenue:', error);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
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

// @route   POST /api/payments/report/create-order
// @desc    Create payment order for report access
// @access  Private
router.post('/report/create-order', auth, async (req, res) => {
  try {
    const { reportId } = req.body;

    // Find the report
    const report = await Report.findById(reportId)
      .populate('appointment')
      .populate('farmer', 'name email mobile')
      .populate('doctor', 'name specialization');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Verify user owns this report
    if (report.farmer._id.toString() !== req.user.toString()) {
      return res.status(403).json({ error: 'Unauthorized access to this report' });
    }

    // Check if payment already completed
    if (report.paymentStatus === 'paid' && report.reportAccessible) {
      return res.status(400).json({ 
        error: 'Report access already paid',
        reportAccessible: true 
      });
    }

    // Get consultation fee from report cost or default
    const consultationFee = report.cost?.consultationFee || 500;
    const totalAmount = report.cost?.total || consultationFee;

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: totalAmount * 100, // Amount in paise
      currency: 'INR',
      receipt: `report_${reportId}_${Date.now()}`,
      notes: {
        reportId: reportId,
        userId: req.user.toString(),
        doctorId: report.doctor._id.toString(),
        type: 'report_payment'
      }
    });

    console.log('📄 Report payment order created:', {
      orderId: order.id,
      reportId: reportId,
      amount: totalAmount,
      user: report.farmer.name
    });

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: totalAmount,
        currency: 'INR',
        reportDetails: {
          title: report.title,
          diagnosis: report.diagnosis,
          doctorName: report.doctor.name,
          animalName: report.animal?.name || 'Pet',
          date: report.createdAt
        }
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_key'
    });

  } catch (error) {
    console.error('❌ Error creating report payment order:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// @route   POST /api/payments/report/verify
// @desc    Verify report payment and grant access
// @access  Private
router.post('/report/verify', auth, async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      reportId 
    } = req.body;

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret')
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.log('❌ Invalid payment signature for report:', reportId);
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update report with payment details
    const report = await Report.findByIdAndUpdate(
      reportId,
      {
        paymentStatus: 'paid',
        reportAccessible: true,
        paymentId: razorpay_payment_id,
        paidAt: new Date()
      },
      { new: true }
    ).populate('farmer', 'name email')
     .populate('doctor', 'name')
     .populate('animal', 'name');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    console.log('✅ Report payment verified successfully:', {
      reportId: reportId,
      paymentId: razorpay_payment_id,
      user: report.farmer.name,
      amount: report.cost?.total || 500
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      reportAccessible: true,
      report: {
        id: report._id,
        title: report.title,
        animalName: report.animal?.name,
        doctorName: report.doctor.name,
        diagnosis: report.diagnosis,
        paidAt: report.paidAt
      }
    });

  } catch (error) {
    console.error('❌ Error verifying report payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// @route   GET /api/payments/report/:reportId/status
// @desc    Check report payment status
// @access  Private
router.get('/report/:reportId/status', auth, async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId)
      .populate('farmer', 'name')
      .select('paymentStatus reportAccessible cost paidAt');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Verify user owns this report
    if (report.farmer._id.toString() !== req.user.toString()) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    res.json({
      success: true,
      paymentStatus: report.paymentStatus,
      reportAccessible: report.reportAccessible,
      amount: report.cost?.total || 500,
      paidAt: report.paidAt
    });

  } catch (error) {
    console.error('❌ Error checking report payment status:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// @route   POST /api/payments/debug/add-pending-payment
// @desc    Add pending payment for testing (Debug only - remove in production)
// @access  Private
router.post('/debug/add-pending-payment', auth, async (req, res) => {
  try {
    const { amount = 230 } = req.body;
    
    // Add a pending payment to the user for testing
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add test consultation to pending payments
    user.paymentStatus.pendingConsultations.push({
      appointmentId: new Date().getTime(), // Mock appointment ID
      doctorId: '68df5f893a2619138e8f56ed', // Mock doctor ID
      amount: amount,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      consultationDate: new Date(),
      status: 'pending'
    });

    // Update payment status
    user.paymentStatus.unpaidAmount += amount;
    user.paymentStatus.hasPendingPayments = true;
    user.paymentStatus.canBookAppointments = false; // Block appointments
    user.paymentStatus.paymentRestrictions.blocked = true;
    user.paymentStatus.paymentRestrictions.blockedReason = `Test pending payment of ₹${amount}. Pay to restore booking access.`;
    user.paymentStatus.paymentRestrictions.blockedSince = new Date();

    await user.save();
    
    console.log(`🧪 DEBUG: Added ₹${amount} pending payment for user ${user.name}`);

    res.json({
      success: true,
      message: `Added ₹${amount} pending payment for testing`,
      paymentStatus: {
        canBookAppointments: user.paymentStatus.canBookAppointments,
        unpaidAmount: user.paymentStatus.unpaidAmount,
        hasPendingPayments: user.paymentStatus.hasPendingPayments,
        blocked: user.paymentStatus.paymentRestrictions.blocked
      }
    });

  } catch (error) {
    console.error('❌ Error adding test pending payment:', error);
    res.status(500).json({ error: 'Failed to add pending payment' });
  }
});

// @route   POST /api/payments/debug/clear-pending-payments
// @desc    Clear all pending payments for testing (Debug only - remove in production)
// @access  Private
router.post('/debug/clear-pending-payments', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Clear all pending payments
    user.paymentStatus.pendingConsultations = [];
    user.paymentStatus.unpaidAmount = 0;
    user.paymentStatus.hasPendingPayments = false;
    user.paymentStatus.canBookAppointments = true;
    user.paymentStatus.paymentRestrictions.blocked = false;
    user.paymentStatus.paymentRestrictions.blockedReason = '';

    await user.save();
    
    console.log(`🧪 DEBUG: Cleared all pending payments for user ${user.name}`);

    res.json({
      success: true,
      message: 'Cleared all pending payments',
      paymentStatus: {
        canBookAppointments: true,
        unpaidAmount: 0,
        hasPendingPayments: false,
        blocked: false
      }
    });

  } catch (error) {
    console.error('❌ Error clearing pending payments:', error);
    res.status(500).json({ error: 'Failed to clear pending payments' });
  }
});

// @route   POST /api/payments/pay-pending-consultations
// @desc    Create Razorpay order for paying all pending consultations
// @access  Private
router.post('/pay-pending-consultations', auth, async (req, res) => {
  try {
    const userId = req.user;

    // Get user with pending consultations
    const user = await User.findById(userId)
      .populate('paymentStatus.pendingConsultations.appointmentId', 'petName date')
      .populate('paymentStatus.pendingConsultations.doctorId', 'name email specialization bankDetails');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has pending payments
    if (!user.paymentStatus.hasPendingPayments || user.paymentStatus.unpaidAmount <= 0) {
      return res.status(400).json({ 
        error: 'No pending payments found',
        message: 'You have no outstanding payments to settle.'
      });
    }

    const totalAmount = user.paymentStatus.unpaidAmount;
    
    // Create Razorpay order
    const orderOptions = {
      amount: totalAmount * 100, // Amount in paise
      currency: 'INR',
      receipt: `pending_payment_${userId}_${Date.now()}`,
      notes: {
        userId: userId,
        paymentType: 'pending_consultations',
        totalConsultations: user.paymentStatus.pendingConsultations.length,
        description: 'Payment for pending consultation fees'
      }
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    // Prepare consultation details for frontend
    const consultationsDetail = user.paymentStatus.pendingConsultations.map(consultation => ({
      consultationId: consultation._id,
      appointmentId: consultation.appointmentId._id,
      petName: consultation.appointmentId.petName,
      doctorName: consultation.doctorId.name,
      doctorSpecialization: consultation.doctorId.specialization,
      amount: consultation.amount,
      consultationDate: consultation.consultationDate,
      dueDate: consultation.dueDate,
      status: consultation.status
    }));

    console.log(`💰 Created Razorpay order for pending consultations: ${razorpayOrder.id}, Amount: ₹${totalAmount}`);

    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: totalAmount,
      currency: 'INR',
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      consultations: consultationsDetail,
      totalConsultations: user.paymentStatus.pendingConsultations.length,
      paymentBreakdown: {
        totalAmount: totalAmount,
        platformFee: Math.round(totalAmount * 0.18), // 18% platform commission
        doctorEarnings: Math.round(totalAmount * 0.82), // 82% to doctors
        perConsultationBreakdown: user.paymentStatus.pendingConsultations.map(consultation => ({
          doctorName: consultation.doctorId.name,
          consultationAmount: consultation.amount,
          platformFee: Math.round(consultation.amount * 0.18),
          doctorEarning: Math.round(consultation.amount * 0.82)
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error creating pending consultations payment order:', error);
    res.status(500).json({ 
      error: 'Failed to create payment order',
      message: 'Unable to process payment request. Please try again.'
    });
  }
});

// @route   POST /api/payments/verify-pending-consultations
// @desc    Verify Razorpay payment for pending consultations and distribute funds
// @access  Private
router.post('/verify-pending-consultations', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user;

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Get user with pending consultations
    const user = await User.findById(userId)
      .populate('paymentStatus.pendingConsultations.appointmentId', 'petName date')
      .populate('paymentStatus.pendingConsultations.doctorId', 'name email specialization bankDetails');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const totalAmount = user.paymentStatus.unpaidAmount;
    const platformCommissionRate = 0.18; // 18% platform commission
    const totalPlatformFee = Math.round(totalAmount * platformCommissionRate);
    const totalDoctorEarnings = totalAmount - totalPlatformFee;

    // Create payment records and distribute funds to each doctor
    const paymentRecords = [];
    const doctorPayouts = {};

    for (const consultation of user.paymentStatus.pendingConsultations) {
      const consultationAmount = consultation.amount;
      const platformFee = Math.round(consultationAmount * platformCommissionRate);
      const doctorEarning = consultationAmount - platformFee;
      const doctorId = consultation.doctorId._id.toString();

      // Create payment record
      const paymentRecord = new Payment({
        user: userId,
        doctor: consultation.doctorId._id,
        appointment: consultation.appointmentId._id,
        amount: consultationAmount,
        currency: 'INR',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        status: 'completed',
        paymentMethod: 'razorpay',
        platformCommission: platformFee,
        doctorEarnings: doctorEarning,
        commissionRate: platformCommissionRate,
        doctorPayout: 'pending',
        metadata: {
          paymentType: 'pending_consultation',
          consultationDate: consultation.consultationDate,
          petName: consultation.appointmentId.petName
        }
      });

      await paymentRecord.save();
      paymentRecords.push(paymentRecord);

      // Accumulate doctor earnings
      if (!doctorPayouts[doctorId]) {
        doctorPayouts[doctorId] = {
          doctor: consultation.doctorId,
          totalEarning: 0,
          consultations: []
        };
      }
      doctorPayouts[doctorId].totalEarning += doctorEarning;
      doctorPayouts[doctorId].consultations.push({
        paymentId: paymentRecord._id,
        consultationAmount: consultationAmount,
        earning: doctorEarning
      });
    }

    // Update doctor earnings in their records
    for (const [doctorId, payout] of Object.entries(doctorPayouts)) {
      const doctor = await Doctor.findById(doctorId);
      if (doctor) {
        // Add to pending earnings
        if (!doctor.earnings) {
          doctor.earnings = {
            totalEarnings: 0,
            pendingPayouts: 0,
            completedPayouts: 0,
            lastPayoutDate: null
          };
        }
        
        doctor.earnings.totalEarnings += payout.totalEarning;
        doctor.earnings.pendingPayouts += payout.totalEarning;
        
        // Add to payout history
        if (!doctor.earnings.payoutHistory) {
          doctor.earnings.payoutHistory = [];
        }
        
        doctor.earnings.payoutHistory.push({
          amount: payout.totalEarning,
          consultations: payout.consultations.length,
          date: new Date(),
          status: 'pending',
          paymentIds: payout.consultations.map(c => c.paymentId)
        });

        await doctor.save();
        
        console.log(`💰 Added ₹${payout.totalEarning} to Dr. ${payout.doctor.name}'s pending earnings`);
      }
    }

    // Clear user's pending payments
    user.paymentStatus.pendingConsultations = [];
    user.paymentStatus.unpaidAmount = 0;
    user.paymentStatus.hasPendingPayments = false;
    user.paymentStatus.canBookAppointments = true;
    user.paymentStatus.paymentRestrictions.blocked = false;
    user.paymentStatus.paymentRestrictions.blockedReason = '';
    user.paymentStatus.lastPaymentDate = new Date();

    await user.save();

    console.log(`✅ Payment verified for user ${userId}: ₹${totalAmount}`);
    console.log(`💰 Platform earned: ₹${totalPlatformFee} (${platformCommissionRate * 100}%)`);
    console.log(`👨‍⚕️ Doctors earned: ₹${totalDoctorEarnings} (${(1 - platformCommissionRate) * 100}%)`);

    res.json({
      success: true,
      message: 'Payment successful! All pending consultations have been paid.',
      paymentDetails: {
        totalPaid: totalAmount,
        platformFee: totalPlatformFee,
        doctorsEarnings: totalDoctorEarnings,
        consultationsPaid: paymentRecords.length,
        razorpayPaymentId: razorpay_payment_id
      },
      doctorPayouts: Object.values(doctorPayouts).map(payout => ({
        doctorName: payout.doctor.name,
        doctorSpecialization: payout.doctor.specialization,
        totalEarning: payout.totalEarning,
        consultationsCount: payout.consultations.length
      })),
      userStatus: {
        canBookAppointments: true,
        pendingAmount: 0,
        accountStatus: 'clear'
      }
    });

  } catch (error) {
    console.error('❌ Error verifying pending consultations payment:', error);
    res.status(500).json({ 
      error: 'Payment verification failed',
      message: 'Unable to process payment verification. Please contact support.'
    });
  }
});

module.exports = router;