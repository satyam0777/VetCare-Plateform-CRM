// Post-Consultation Payment Flow Handler
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const Appointment = require('../models/Appointment');
const Report = require('../models/Report');
const paymentService = require('../services/paymentService');
const notificationService = require('../services/notificationService');

// @route   POST /api/consultation/complete
// @desc    Complete consultation and generate payment request
// @access  Private (Doctor only)
router.post('/complete', auth, async (req, res) => {
  try {
    const { appointmentId, diagnosis, treatment, prescription, followUpRequired, consultationNotes } = req.body;

    // Find appointment and verify doctor access
    const appointment = await Appointment.findById(appointmentId)
      .populate('user', 'name email')
      .populate('doctor', 'name email');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.doctor._id.toString() !== req.user.toString()) {
      return res.status(403).json({ error: 'Unauthorized: Not your appointment' });
    }

    if (appointment.status !== 'confirmed' && appointment.status !== 'in-progress') {
      return res.status(400).json({ error: 'Cannot complete this appointment' });
    }

    // Create consultation report
    const report = new Report({
      appointment: appointmentId,
      patient: appointment.user._id,
      doctor: appointment.doctor._id,
      petName: appointment.petName,
      petSpecies: appointment.petSpecies,
      diagnosis,
      treatment,
      prescription: prescription || [],
      followUpRequired: followUpRequired || false,
      consultationNotes,
      dateGenerated: new Date(),
      status: 'completed'
    });

    await report.save();

    // Update appointment with consultation completion
    appointment.status = 'completed';
    appointment.consultation = {
      ...appointment.consultation,
      completed: true,
      completedAt: new Date(),
      reportId: report._id
    };
    
    // Set payment as pending - user needs to pay now
    appointment.payment = {
      ...appointment.payment,
      status: 'pending',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours to pay
      consultationFee: appointment.consultationFee || 500 // Default fee
    };

    await appointment.save();

    // Send notification to patient that consultation is complete and payment is due
    await notificationService.sendNotification(appointment.user._id, {
      title: '✅ Consultation Completed!',
      body: `Dr. ${appointment.doctor.name} has completed your consultation for ${appointment.petName}. Please complete payment to access your medical report.`,
      type: 'consultation_completed',
      data: {
        appointmentId: appointmentId,
        doctorName: appointment.doctor.name,
        petName: appointment.petName,
        reportId: report._id.toString(),
        paymentDue: true,
        amount: appointment.payment.consultationFee
      }
    });

    // Send notification to doctor that consultation is completed
    await notificationService.sendNotification(appointment.doctor._id, {
      title: '📋 Consultation Report Submitted',
      body: `You have successfully completed the consultation for ${appointment.petName}. Payment notification sent to patient.`,
      type: 'consultation_submitted',
      data: {
        appointmentId: appointmentId,
        petName: appointment.petName,
        reportId: report._id.toString()
      }
    });

    res.json({
      success: true,
      message: 'Consultation completed successfully',
      appointment: {
        id: appointment._id,
        status: appointment.status,
        petName: appointment.petName,
        patientName: appointment.user.name,
        paymentDue: appointment.payment.consultationFee,
        reportGenerated: true
      },
      report: {
        id: report._id,
        diagnosis,
        treatment,
        generatedAt: report.dateGenerated
      },
      payment: {
        status: 'pending',
        amount: appointment.payment.consultationFee,
        dueDate: appointment.payment.dueDate
      }
    });

  } catch (error) {
    console.error('❌ Error completing consultation:', error);
    res.status(500).json({ error: 'Failed to complete consultation' });
  }
});

// @route   GET /api/consultation/payment-due/:appointmentId
// @desc    Check if payment is due for completed consultation
// @access  Private
router.get('/payment-due/:appointmentId', auth, async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId)
      .populate('user', 'name email')
      .populate('doctor', 'name email specialization consultationFee');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if user has access to this appointment
    const userId = req.user.toString();
    if (appointment.user._id.toString() !== userId && appointment.doctor._id.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Check if consultation is completed and payment is pending
    const isPaymentDue = appointment.status === 'completed' && 
                        appointment.payment.status === 'pending';

    if (!isPaymentDue) {
      return res.json({
        paymentDue: false,
        message: 'No payment required',
        appointmentStatus: appointment.status,
        paymentStatus: appointment.payment.status
      });
    }

    // Calculate total amount (consultation fee + platform fee + tax)
    const consultationFee = appointment.payment.consultationFee || appointment.doctor.consultationFee || 500;
    const platformFee = Math.round(consultationFee * 0.15); // 15% platform fee
    const subtotal = consultationFee + platformFee;
    const tax = Math.round(subtotal * 0.18); // 18% GST
    const totalAmount = subtotal + tax;

    res.json({
      paymentDue: true,
      appointment: {
        id: appointment._id,
        petName: appointment.petName,
        doctorName: appointment.doctor.name,
        doctorSpecialization: appointment.doctor.specialization,
        consultationDate: appointment.date,
        consultationTime: appointment.time
      },
      payment: {
        consultationFee,
        platformFee,
        tax,
        totalAmount,
        dueDate: appointment.payment.dueDate,
        currency: 'INR'
      },
      patient: {
        name: appointment.user.name,
        email: appointment.user.email
      }
    });

  } catch (error) {
    console.error('❌ Error checking payment due:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// @route   POST /api/consultation/process-payment
// @desc    Process payment for completed consultation
// @access  Private
router.post('/process-payment', auth, async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId)
      .populate('user', 'name email')
      .populate('doctor', 'name email');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify user access
    if (appointment.user._id.toString() !== req.user.toString()) {
      return res.status(403).json({ error: 'Unauthorized: Not your appointment' });
    }

    // Check if payment is due
    if (appointment.status !== 'completed' || appointment.payment.status !== 'pending') {
      return res.status(400).json({ error: 'Payment not required for this appointment' });
    }

    // Calculate amounts
    const consultationFee = appointment.payment.consultationFee;
    const platformFee = Math.round(consultationFee * 0.15);
    const subtotal = consultationFee + platformFee;
    const tax = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + tax;

    // Create Razorpay order
    const razorpayOrder = await paymentService.createOrder({
      amount: totalAmount * 100, // Convert to paise
      currency: 'INR',
      receipt: `consultation_${appointmentId}_${Date.now()}`,
      notes: {
        appointmentId: appointmentId,
        consultationType: 'post_consultation',
        petName: appointment.petName,
        doctorName: appointment.doctor.name
      }
    });

    // Update appointment with payment order
    appointment.payment.razorpayOrderId = razorpayOrder.id;
    appointment.payment.amount = totalAmount;
    await appointment.save();

    res.json({
      success: true,
      paymentOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
      },
      appointmentDetails: {
        id: appointment._id,
        petName: appointment.petName,
        doctorName: appointment.doctor.name
      },
      paymentBreakdown: {
        consultationFee,
        platformFee,
        tax,
        totalAmount
      }
    });

  } catch (error) {
    console.error('❌ Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

module.exports = router;