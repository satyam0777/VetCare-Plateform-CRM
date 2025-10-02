const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const Doctor = require('../models/Doctor');
const emailService = require('../services/emailService'); // Using clean email service

// @route   PUT /api/doctors/:id
// @desc    Update doctor profile (availability, mode, etc)
// @access  Doctor (or admin)
router.put('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json(doctor);
  } catch (err) {
    console.error('❌ Error updating doctor:', err);
    res.status(500).json({ error: 'Failed to update doctor' });
  }
});

// @route   POST /api/doctors/:id/access-link
// @desc    Generate and send unique access link to approved doctor
// @access  Admin only
router.post('/:id/access-link', doctorController.sendAccessLink);

// @route   POST /api/doctors
// @desc    Create a new doctor (pending approval by default)
// @access  Public
router.post('/', async (req, res) => {
  try {
    console.log("📥 Doctor registration request:", req.body);
    
    // Check if doctor with email already exists
    const existingDoctor = await Doctor.findOne({ email: req.body.email });
    if (existingDoctor) {
      return res.status(400).json({ error: 'Doctor with this email already exists' });
    }
    
    const doctor = new Doctor({
      ...req.body,
      approved: false // Default to not approved
    });
    
    await doctor.save();
    console.log("✅ Doctor created:", doctor);
    res.status(201).json(doctor);
  } catch (err) {
    console.error("❌ Error creating doctor:", err);
    res.status(500).json({ error: 'Failed to create doctor profile' });
  }
});

// @route   GET /api/doctors
// @desc    Get all approved doctors (for public viewing)
// @access  Public
router.get('/', async (req, res) => {
  try {
    // If uniqueAccessLink is provided, fetch doctor by link
    if (req.query.uniqueAccessLink) {
      const doctor = await Doctor.findOne({ uniqueAccessLink: req.query.uniqueAccessLink });
      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }
      return res.json([doctor]);
    }
  const approvedDoctors = await Doctor.find({ approved: true }).sort({ createdAt: -1 });
  console.log(`✅ Found ${approvedDoctors.length} approved doctors`);
  res.json(approvedDoctors);
  } catch (err) {
    console.error("❌ Error fetching approved doctors:", err);
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
});

// @route   GET /api/doctors/pending
// @desc    Get all pending doctors (for admin approval)
// @access  Admin only (you should add authentication middleware)
router.get('/pending', async (req, res) => {
  try {
    const pendingDoctors = await Doctor.find({ approved: false }).sort({ createdAt: -1 });
    console.log(`✅ Found ${pendingDoctors.length} pending doctors`);
    res.json(pendingDoctors);
  } catch (err) {
    console.error("❌ Error fetching pending doctors:", err);
    res.status(500).json({ message: 'Failed to fetch pending doctors' });
  }
});

// @route   PUT /api/doctors/:id/approve
// @desc    Approve a doctor by ID and send email with access link
// @access  Admin only (you should add authentication middleware)
router.put('/:id/approve', async (req, res) => {
  try {
    // Generate unique access link for the doctor
    const { uniqueToken, accessLink } = emailService.generateDoctorAccessLink(req.params.id);

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { 
        approved: true,
        status: 'active',
        uniqueAccessLink: uniqueToken,
        approvedAt: new Date()
      },
      { new: true }
    );
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    
    // Send approval email with access link
    try {
      console.log(`📧 Starting email process for ${doctor.email}...`);
      console.log(`🔗 Generated access link: ${accessLink}`);
      
      await emailService.sendDoctorApprovalEmail(doctor, accessLink);
      console.log(`✅ Approval email sent successfully to ${doctor.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send approval email:', emailError.message);
      // Don't fail the approval if email fails
    }
    
    console.log("✅ Doctor approved:", doctor);
    res.status(200).json({ 
      message: "Doctor approved successfully and email sent", 
      doctor,
      accessLink: accessLink
    });
  } catch (err) {
    console.error("❌ Error approving doctor:", err);
    res.status(500).json({ message: "Failed to approve doctor" });
  }
});

// @route   PUT /api/doctors/:id/reject
// @desc    Reject a doctor application and send notification email
// @access  Admin only
router.put('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected',
        rejectionReason: reason || 'Application requirements not met',
        rejectedAt: new Date()
      },
      { new: true }
    );
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    
    // Send rejection email
    try {
      console.log(`📧 Sending rejection email to ${doctor.email}...`);
      await emailService.sendDoctorRejectionEmail(doctor, reason);
      console.log(`✅ Rejection email sent successfully to ${doctor.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send rejection email:', emailError.message);
      // Don't fail the rejection if email fails
    }
    
    console.log("❌ Doctor rejected:", doctor.name);
    res.status(200).json({ 
      message: "Doctor application rejected and notification sent", 
      doctor
    });
  } catch (err) {
    console.error("❌ Error rejecting doctor:", err);
    res.status(500).json({ message: "Failed to reject doctor application" });
  }
});

// @route   DELETE /api/doctors/:id
// @desc    Delete a doctor by ID and send notification email
// @access  Admin only (you should add authentication middleware)
router.delete('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Send removal notification email before deleting
    try {
      console.log(`📧 Sending removal notification to ${doctor.email}...`);
      await emailService.sendDoctorRemovalEmail(doctor, req.body.reason || 'Administrative decision');
      console.log(`✅ Removal email sent successfully to ${doctor.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send removal email:', emailError.message);
      // Continue with deletion even if email fails
    }

    // Delete the doctor
    const deletedDoctor = await Doctor.findByIdAndDelete(req.params.id);
    
    console.log("✅ Doctor deleted:", deletedDoctor.name);
    res.status(200).json({ 
      message: 'Doctor deleted successfully and notification sent',
      doctor: deletedDoctor
    });
  } catch (error) {
    console.error("❌ Error deleting doctor:", error);
    res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;



// This code defines the routes for managing doctors in a veterinary care application.
// It uses Express to create a router that handles GET requests to list doctors and POST requests to add a new doctor.
// The `getDoctors` function retrieves a list of doctors, while the `addDoctor` function allows authenticated users (typically admins) to add a new doctor.