const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Report = require('../models/Report');
const Animal = require('../models/Animal');
const User = require('../models/User');
const { auth, doctorAuth } = require('../middleware/authMiddleware');
const { checkPaymentStatus, addPendingPayment } = require('../middleware/paymentMiddleware');

// Helper function to check if user is admin
const isAdminUser = (userId, userRole) => {
  return userId === 'admin' || userRole === 'admin';
};

// @route   GET /api/appointments/user/:id
// @desc    Get all appointments for a user by user ID
// @access  Public (add authentication as needed)
router.get('/user/:id', async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.params.id })
      .populate('doctor', 'name specialization email')
      .populate('user', 'name email')
      .sort({ date: -1 });
    res.json(appointments);
  } catch (err) {
    console.error('❌ Error fetching appointments by user ID:', err);
    res.status(500).json({ message: 'Failed to load appointments' });
  }
});

// @route   POST /api/appointments
// @desc    Book a new appointment (with payment status check)
// @access  Private (authenticated users only)
router.post('/', auth, checkPaymentStatus, async (req, res) => {
  console.log("📥 Appointment request body:", req.body);

  try {
    // Handle admin users - they cannot book appointments
    if (isAdminUser(req.user, req.userRole)) {
      return res.status(403).json({ 
        error: 'Admin users cannot book appointments' 
      });
    }
    // Validate required fields
    const { doctor, user, petName, reason, date, time } = req.body;
    if (!doctor || !user || !petName || !reason || !date || !time) {
      return res.status(400).json({ 
        error: "All fields are required: doctor, user, petName, reason, date, time" 
      });
    }
    // Ensure the user field matches the authenticated user
    if (user !== req.user.toString()) {
      return res.status(403).json({ 
        error: 'You can only book appointments for yourself' 
      });
    }
    const appointment = new Appointment({
      ...req.body,
      status: 'pending' // Default status
    });
    const savedAppointment = await appointment.save();
    // Populate the doctor and user information for the response and emails
    await savedAppointment.populate('doctor', 'name specialization email');
    await savedAppointment.populate('user', 'name email');
    // Send email to user and doctor (company-style)
    try {
      const emailService = require('../services/emailService');
      console.log('📧 [ROUTE] Sending appointment booked email to user:', savedAppointment.user.email);
      const userEmailResult = await emailService.sendAppointmentBookedEmail({
        user: savedAppointment.user,
        doctor: savedAppointment.doctor,
        appointment: savedAppointment
      });
      console.log('📧 [ROUTE] User email result:', userEmailResult);
      console.log('📧 [ROUTE] Sending appointment booked email to doctor:', savedAppointment.doctor.email);
      const doctorEmailResult = await emailService.sendAppointmentBookedDoctorEmail({
        doctor: savedAppointment.doctor,
        user: savedAppointment.user,
        appointment: savedAppointment
      });
      console.log('📧 [ROUTE] Doctor email result:', doctorEmailResult);
    } catch (emailErr) {
      console.error('❌ Failed to send appointment emails:', emailErr);
    }
    console.log("✅ Appointment saved:", savedAppointment);
    res.status(201).json(savedAppointment);
  } catch (err) {
    console.error("❌ Error saving appointment:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// @route   PUT /api/appointments/:id/confirm
// @desc    Confirm appointment (Doctor only)
// @access  Doctor authentication required
router.put('/:id/confirm', doctorAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'confirmed',
        confirmedAt: new Date()
      },
      { new: true }
    ).populate('doctor', 'name specialization email')
     .populate('user', 'name email petName');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    console.log(`✅ Appointment ${req.params.id} confirmed by doctor`);
    res.json(appointment);
  } catch (err) {
    console.error('❌ Error confirming appointment:', err);
    res.status(500).json({ message: 'Failed to confirm appointment' });
  }
});

// @route   PUT /api/appointments/:id/cancel
// @desc    Cancel appointment (Doctor or User)
// @access  Authentication required
router.put('/:id/cancel', doctorAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason
      },
      { new: true }
    ).populate('doctor', 'name specialization email')
     .populate('user', 'name email petName');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    console.log(`✅ Appointment ${req.params.id} cancelled`);
    res.json(appointment);
  } catch (err) {
    console.error('❌ Error cancelling appointment:', err);
    res.status(500).json({ message: 'Failed to cancel appointment' });
  }
});

// @route   PUT /api/appointments/:id/consultation
// @desc    Add consultation details (Doctor only)
// @access  Doctor authentication required
router.put('/:id/consultation', doctorAuth, async (req, res) => {
  try {
    const { consultation, prescription, payment } = req.body;
    const updateData = {};
    if (consultation) {
      updateData.consultation = consultation;
    }
    if (prescription) {
      updateData.prescription = {
        ...prescription,
        prescribedAt: new Date()
      };
    }
    if (payment) {
      updateData.payment = payment;
    }
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('doctor', 'name specialization email')
     .populate('user', 'name email petName');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    // Send consultation started emails to user and doctor
    try {
      const emailService = require('../services/emailService');
      console.log('[DEBUG] Attempting to send consultation started email to user:', appointment.user?.email);
      const userEmailResult = await emailService.sendConsultationStartedEmail({
        user: appointment.user,
        doctor: appointment.doctor,
        appointment
      });
      console.log('[DEBUG] sendConsultationStartedEmail result:', userEmailResult);
      const doctorEmailResult = await emailService.sendConsultationStartedDoctorEmail({
        doctor: appointment.doctor,
        user: appointment.user,
        appointment
      });
      console.log('[DEBUG] sendConsultationStartedDoctorEmail result:', doctorEmailResult);
    } catch (emailErr) {
      console.error('❌ Failed to send consultation started emails:', emailErr);
    }
    console.log(`✅ Consultation details added to appointment ${req.params.id}`);
    res.json(appointment);
  } catch (err) {
    console.error('❌ Error updating consultation:', err);
    res.status(500).json({ message: 'Failed to update consultation' });
  }
});

// @route   PUT /api/appointments/:id/complete
// @desc    Complete appointment and generate report (Doctor only) - Now triggers payment flow
// @access  Doctor authentication required
router.put('/:id/complete', doctorAuth, async (req, res) => {
  try {
    console.log(`🔄 Starting appointment completion for ID: ${req.params.id}`);
    console.log(`📥 Request body:`, req.body);
    console.log(`📋 Content-Type:`, req.headers['content-type']);
    
    // ✅ Add safety check for req.body
    if (!req.body || typeof req.body !== 'object') {
      console.log('⚠️ Empty or invalid request body - using defaults');
      req.body = {};
    }
    
    const { consultation = {}, prescription = {}, consultationFee = 500 } = req.body;

    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'name specialization email')
      .populate('user', 'name email petName');

    if (!appointment) {
      console.log(`❌ Appointment not found: ${req.params.id}`);
      return res.status(404).json({ message: 'Appointment not found' });
    }

    console.log(`📋 Found appointment: ${appointment.petName} for ${appointment.user.name}`);
    console.log(`👨‍⚕️ Doctor info in appointment:`, {
      doctorId: appointment.doctor?._id,
      doctorName: appointment.doctor?.name,
      doctorData: appointment.doctor
    });

    // Add consultation details and prescription
    if (consultation) {
      appointment.consultation = {
        ...consultation,
        completedAt: new Date()
      };
    }

    if (prescription) {
      appointment.prescription = {
        ...prescription,
        prescribedAt: new Date()
      };
    }

    // Update appointment status to 'report_ready' (waiting for payment)
    appointment.status = 'report_ready';
    appointment.completedAt = new Date();
    appointment.reportGenerated = true;
    appointment.reportGeneratedAt = new Date();

    // --- Add tax and update payment breakdown ---
    const platformFee = Math.round(consultationFee * 0.15); // 15% platform fee
    const taxRate = 0.05; // 5% GST or service tax
    const tax = Math.round(consultationFee * taxRate);
    const totalAmount = consultationFee + platformFee + tax;

    appointment.payment = {
      consultationFee: consultationFee,
      platformFee: platformFee,
      tax: tax,
      totalAmount: totalAmount,
      status: 'pending',
      createdAt: new Date()
    };

    await appointment.save();
    // Fetch the latest appointment (with updated payment) for email
    const updatedAppointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'name specialization email')
      .populate('user', 'name email petName');
    console.log(`✅ Appointment status updated to report_ready - waiting for payment`);

    // Find or create animal record for the pet
    let animal = await Animal.findOne({ 
      name: appointment.petName,
      owner: appointment.user._id
    });

    if (!animal) {
      // Create new animal record with minimal info
      animal = new Animal({
        name: appointment.petName || 'Unknown Pet',
        type: 'other', // Default type since we don't collect this in appointments
        age: 1, // Default age
        gender: 'male', // Default gender
        owner: appointment.user._id,
        healthStatus: 'under_treatment'
      });
      await animal.save();
      console.log(`✅ Created new animal record for ${appointment.petName} with ID: ${animal._id}`);
    } else {
      console.log(`📋 Found existing animal record for ${appointment.petName} with ID: ${animal._id}`);
    }

    console.log(`🔄 Creating medical report...`);
    
    // Create medical report
    const report = new Report({
      title: `Consultation Report - ${appointment.petName}`,
      animal: animal._id,
      farmer: appointment.user._id,
      doctor: appointment.doctor._id,
      appointment: appointment._id,
      reportType: 'consultation',
      diagnosis: appointment.consultation?.diagnosis || 'General checkup',
      symptoms: appointment.consultation?.symptoms ? [appointment.consultation.symptoms] : [],
      treatment: appointment.consultation?.examination || 'Routine examination completed',
      recommendations: appointment.consultation?.recommendations || 'Follow regular care guidelines',
      prescriptions: appointment.prescription?.medicines?.map(med => ({
        medicineName: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions || 'Take as prescribed'
      })) || [],
      cost: {
  consultationFee: appointment.payment?.consultationFee || 0,
  platformFee: appointment.payment?.platformFee || 0,
  tax: appointment.payment?.tax || 0,
  medicinesCost: appointment.payment?.medicineCharges || 0,
  total: appointment.payment?.totalAmount || 0
      },
      status: 'completed',
      doctorNotes: appointment.consultation?.notes || ''
    });

    await report.save();
    console.log(`✅ Medical report created with ID: ${report._id}`);

    // Add consultation to user's pending payments list
    try {
      const consultationAmount = appointment.payment?.totalAmount || 500;
      await addPendingPayment(
        appointment.user._id,
        appointment._id,
        appointment.doctor._id,
        consultationAmount,
        appointment.date
      );
      console.log(`💰 Added ₹${consultationAmount} to user's pending payments for consultation ${appointment._id}`);
    } catch (paymentError) {
      console.error('❌ Failed to add pending payment:', paymentError);
      // Continue execution - don't fail the whole process
    }

    // Send notification to user about report ready and payment required
    try {
      const NotificationService = require('../services/notificationService');
      await NotificationService.sendNotification(appointment.user._id, {
        title: '📋 Medical Report Ready - Payment Required',
        body: `Dr. ${appointment.doctor.name} has completed your consultation for ${appointment.petName}. Please complete payment of ₹${appointment.payment?.totalAmount || 500} to access the full report.`,
        type: 'report_ready',
        data: {
          appointmentId: appointment._id.toString(),
          doctorName: appointment.doctor.name,
          petName: appointment.petName,
          consultationFee: appointment.payment?.consultationFee || 0,
          totalAmount: appointment.payment?.totalAmount || 0,
          action: 'make_payment',
          paymentRequired: true
        }
      });
      console.log(`✅ Notification sent to user about report ready and payment required`);
    } catch (notifError) {
      console.log(`⚠️ Failed to send notification:`, notifError.message);
    }

    // Send consultation completed emails to user and doctor
    try {
      const emailService = require('../services/emailService');
      await emailService.sendConsultationCompletedEmail({
        user: appointment.user,
        doctor: appointment.doctor,
        appointment,
        report
      });
      await emailService.sendConsultationCompletedDoctorEmail({
        doctor: appointment.doctor,
        user: appointment.user,
        appointment,
        report
      });
    } catch (emailErr) {
      console.error('❌ Failed to send consultation completed emails:', emailErr);
    }
    console.log(`✅ Appointment ${req.params.id} completed with report - waiting for payment`);
    res.json({ 
      appointment, 
      report,
      message: 'Consultation completed successfully. Report generated and waiting for payment.',
      nextStep: 'payment_required'
    });
  } catch (err) {
    console.error('❌ Error completing appointment:', err);
    res.status(500).json({ 
      message: 'Failed to complete appointment',
      error: err.message 
    });
  }
});

// @route   GET /api/appointments/:email
// @desc    Get all appointments for a user by email
// @access  Public (you might want to add authentication later)
router.get('/:email', async (req, res) => {
  try {
    // First find the user by email to get their _id
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Then find appointments by user _id
    const appointments = await Appointment.find({ user: user._id })
      .populate('doctor', 'name specialization email phone')
      .populate('user', 'name email petName')
      .sort({ date: -1 });

    console.log(`✅ Found ${appointments.length} appointments for ${req.params.email}`);
    res.json(appointments);
  } catch (err) {
    console.error('❌ Error fetching appointments:', err);
    res.status(500).json({ message: 'Failed to load appointments' });
  }
});

// @route   GET /api/appointments
// @desc    Get appointments with filtering (for admin or doctor)
// @access  Admin only (you might want to add authentication)
router.get('/', async (req, res) => {
  try {
    const { doctor, date, status } = req.query;
    let filter = {};
    
    // If doctor ID is provided, filter by doctor
    if (doctor) {
      filter.doctor = doctor;
    }
    
    // If date is provided, filter by date
    if (date) {
      filter.date = date;
    }
    
    // If status is provided, filter by status
    if (status) {
      filter.status = status;
    }

    const appointments = await Appointment.find(filter)
      .populate('doctor', 'name specialization email')
      .populate('user', 'name email petName')
      .sort({ date: -1, time: 1 });

    console.log(`✅ Found ${appointments.length} appointments with filter:`, filter);
    res.json(appointments);
  } catch (err) {
    console.error('❌ Error fetching appointments:', err);
    res.status(500).json({ message: 'Failed to load appointments' });
  }
});

// @route   GET /api/appointments/doctor/:doctorId
// @desc    Get all appointments for a specific doctor
// @access  Doctor authentication required OR public with valid doctor link
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    console.log('🔍 Doctor appointments request:', {
      doctorId: req.params.doctorId,
      hasAuth: !!req.header('Authorization'),
      hasDoctorLink: !!req.header('Doctor-Link'),
      query: req.query
    });

    // Check if doctor link is provided in header or query
    const doctorLink = req.header('Doctor-Link') || req.query.doctorLink;
    
    if (doctorLink) {
      // Verify the doctor link
      const Doctor = require('../models/Doctor');
      const doctor = await Doctor.findOne({ 
        uniqueAccessLink: doctorLink,
        status: 'active'
      });
      
      if (!doctor) {
        console.log('❌ Invalid doctor link:', doctorLink);
        return res.status(401).json({ message: 'Invalid doctor access link' });
      }
      
      // Verify the doctor ID matches
      if (doctor._id.toString() !== req.params.doctorId) {
        console.log('❌ Doctor ID mismatch:', { 
          linkDoctorId: doctor._id.toString(), 
          requestedDoctorId: req.params.doctorId 
        });
        return res.status(403).json({ message: 'Doctor ID does not match access link' });
      }
      
      console.log('✅ Doctor verified via link:', doctor.name);
    } else {
      // No doctor link, require JWT authentication
      return res.status(401).json({ message: 'Doctor authentication required' });
    }

    const { date } = req.query;
    let filter = { doctor: req.params.doctorId };
    
    // If date is provided, filter by specific date, otherwise get all
    if (date) {
      filter.date = date;
    }

    const appointments = await Appointment.find(filter)
      .populate('doctor', 'name specialization email')
      .populate('user', 'name email petName')
      .sort({ date: -1, time: 1 });

    console.log(`✅ Found ${appointments.length} appointments for doctor ${req.params.doctorId}`);
    res.json(appointments);
  } catch (err) {
    console.error('❌ Error fetching doctor appointments:', err);
    res.status(500).json({ message: 'Failed to load doctor appointments' });
  }
});

// @route   PATCH /api/appointments/:id
// @desc    Update appointment status
// @access  Doctor/Admin authentication required
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('doctor', 'name specialization email')
     .populate('user', 'name email petName');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    console.log(`✅ Updated appointment ${req.params.id} status to ${status}`);
    res.json(appointment);
  } catch (err) {
    console.error('❌ Error updating appointment:', err);
    res.status(500).json({ message: 'Failed to update appointment' });
  }
});

// @route   DELETE /api/appointments/:id
// @desc    Delete/Cancel appointment
// @access  Admin authentication required
router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    console.log(`✅ Deleted appointment ${req.params.id}`);
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (err) {
    console.error('❌ Error deleting appointment:', err);
    res.status(500).json({ message: 'Failed to cancel appointment' });
  }
});

// @route   GET /api/appointments/:id/payment-status
// @desc    Check if appointment needs payment (for frontend)
// @access  Private
router.get('/:id/payment-status', auth, async (req, res) => {
  try {
    // Handle admin users - they don't have personal appointments
    if (isAdminUser(req.user, req.userRole)) {
      return res.status(403).json({ 
        error: 'Admin users do not have personal appointments' 
      });
    }
    
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'name specialization')
      .populate('user', 'name email');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check user authorization
    const userId = req.user.toString();
    if (appointment.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const paymentStatus = {
      appointmentId: appointment._id,
      status: appointment.status,
      reportReady: appointment.status === 'report_ready' || appointment.status === 'completed',
      paymentRequired: appointment.status === 'report_ready',
      paymentCompleted: appointment.payment?.status === 'completed',
      consultationFee: appointment.payment?.consultationFee || 0,
      platformFee: appointment.payment?.platformFee || 0,
      totalAmount: appointment.payment?.totalAmount || 0,
      doctorName: appointment.doctor.name,
      petName: appointment.petName,
      appointmentDate: appointment.date,
      appointmentTime: appointment.time
    };

    res.json({
      success: true,
      paymentStatus
    });

  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

module.exports = router;





// This code defines the routes for managing appointments in a veterinary care application.
// It uses Express to create a router that handles POST requests for booking new appointments and GET requests