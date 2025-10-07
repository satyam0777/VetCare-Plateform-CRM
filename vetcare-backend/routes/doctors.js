const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const Doctor = require('../models/Doctor');
const emailService = require('../services/emailService'); // Using clean email service
const upload = require('../middleware/upload'); // For document uploads

// @route   PUT /api/doctors/:id/banking
// @desc    Update doctor banking details
// @access  Doctor
router.put('/:id/banking', async (req, res) => {
  try {
    const { bankDetails } = req.body;
    
    // Validate required fields
    if (!bankDetails.accountHolderName || !bankDetails.accountNumber || 
        !bankDetails.ifscCode || !bankDetails.bankName) {
      return res.status(400).json({ error: 'All banking fields are required' });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          bankDetails: {
            ...bankDetails,
            verified: false // Reset verification when details change
          }
        }
      },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ 
      message: 'Banking details updated successfully',
      bankDetails: doctor.bankDetails 
    });
  } catch (err) {
    console.error('❌ Error updating banking details:', err);
    res.status(500).json({ error: 'Failed to update banking details' });
  }
});

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
// @desc    Create a new doctor with document verification (pending approval by default)
// @access  Public
router.post('/', upload.doctorDocuments, async (req, res) => {
  try {
    console.log("📥 Doctor registration request:", req.body);
    console.log("📎 Uploaded files:", req.files);
    
    // Check if doctor with email already exists
    const existingDoctor = await Doctor.findOne({ email: req.body.email });
    if (existingDoctor) {
      // If doctor was rejected, allow them to reapply by updating their record
      if (existingDoctor.status === 'rejected') {
        console.log(`🔄 Rejected doctor ${req.body.email} is reapplying...`);
        
        // Process uploaded documents
        const documents = {};
        if (req.files) {
          if (req.files.license) documents.license = req.files.license[0].path;
          if (req.files.degree) documents.degree = req.files.degree[0].path;
          if (req.files.experience) documents.experience = req.files.experience[0].path;
          if (req.files.photo) documents.photo = req.files.photo[0].path;
          if (req.files.idProof) documents.idProof = req.files.idProof[0].path;
        }
        
        // Calculate profile completeness score
        const requiredFields = ['name', 'email', 'phone', 'specialization', 'experience', 'qualifications', 'consultationFee'];
        const requiredDocs = ['license', 'degree', 'photo', 'idProof'];
        
        const fieldScore = requiredFields.filter(field => req.body[field]).length / requiredFields.length * 60; // 60% for fields
        const docScore = Object.keys(documents).length / requiredDocs.length * 40; // 40% for documents
        const profileCompleteness = Math.round(fieldScore + docScore);
        
        // Update existing rejected doctor with new information
        const updatedDoctor = await Doctor.findByIdAndUpdate(existingDoctor._id, {
          ...req.body,
          documents,
          profileCompleteness,
          status: 'pending', // Reset status to pending
          approved: false,
          rejectionReason: undefined, // Clear previous rejection reason
          rejectedAt: undefined,
          rejectedBy: undefined,
          createdAt: new Date() // Update creation date for new application
        }, { new: true });
        
        console.log("✅ Rejected doctor reapplication updated successfully");
        return res.status(200).json(updatedDoctor);
      } else {
        return res.status(400).json({ error: 'Doctor with this email already exists' });
      }
    }
    
    // Process uploaded documents
    const documents = {};
    if (req.files) {
      if (req.files.license) documents.license = req.files.license[0].path;
      if (req.files.degree) documents.degree = req.files.degree[0].path;
      if (req.files.experience) documents.experience = req.files.experience[0].path;
      if (req.files.photo) documents.photo = req.files.photo[0].path;
      if (req.files.idProof) documents.idProof = req.files.idProof[0].path;
    }
    
    // Calculate profile completeness score
    const requiredFields = ['name', 'email', 'phone', 'specialization', 'experience', 'qualifications', 'consultationFee'];
    const requiredDocs = ['license', 'degree', 'photo', 'idProof'];
    
    const fieldScore = requiredFields.filter(field => req.body[field]).length / requiredFields.length * 60; // 60% for fields
    const docScore = Object.keys(documents).length / requiredDocs.length * 40; // 40% for documents
    const profileCompleteness = Math.round(fieldScore + docScore);
    
    const doctor = new Doctor({
      ...req.body,
      documents,
      profileCompleteness,
      approved: false, // Default to not approved
      status: 'pending', // Use valid enum value
      submittedAt: new Date()
    });
    
    await doctor.save();
    console.log("✅ Doctor created with documents:", doctor);
    
    // Send confirmation email to doctor
    try {
      const emailService = require('../services/emailService');
      const subject = '📋 Application Received - VetCare Verification Process';
      const htmlContent = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #2563eb;">Application Received Successfully! 📋</h2>
          <p>Dear Dr. ${doctor.name},</p>
          <p>Thank you for applying to join VetCare. We have received your application and all required documents.</p>
          
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Next Steps:</h3>
            <ol style="color: #374151;">
              <li>Document Review: Our team will verify your credentials</li>
              <li>Phone Interview: We'll schedule a brief verification call</li>
              <li>Approval: Once verified, you'll receive your dashboard access</li>
            </ol>
          </div>
          
          <p style="color: #374151;">
            <strong>Profile Completeness:</strong> ${profileCompleteness}%<br>
            <strong>Consultation Fee:</strong> ₹${doctor.consultationFee} (You keep 85%, platform fee 15%)<br>
            <strong>Status:</strong> Pending Review<br>
            <strong>Expected Processing Time:</strong> 2-3 business days
          </p>
          
          <p>We'll contact you soon to complete the verification process.</p>
          <p>Best regards,<br>The VetCare Team</p>
        </div>
      `;
      
        console.log('📧 [ROUTE] Sending doctor registration confirmation to:', doctor.email);
        const emailResult = await emailService.sendEmail({
          to: doctor.email,
          subject,
          html: htmlContent
        });
        console.log('📧 [ROUTE] Email result:', emailResult);
      console.log(`✅ Confirmation email sent to Dr. ${doctor.name}`);
    } catch (emailError) {
      console.error('❌ Failed to send confirmation email:', emailError);
    }
    
    res.status(201).json({
      message: 'Application submitted successfully',
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        profileCompleteness,
        status: 'pending',
        documentsUploaded: Object.keys(documents).length
      }
    });
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
// @desc    Get all pending doctors with documents (for admin approval)
// @access  Admin only (you should add authentication middleware)
router.get('/pending', async (req, res) => {
  try {
    const pendingDoctors = await Doctor.find({ 
      approved: false,
      status: { $ne: 'rejected' } // Exclude rejected doctors
    }).sort({ createdAt: -1 });
    console.log(`✅ Found ${pendingDoctors.length} pending doctors`);
    
    // Add document status and verification checklist for each doctor
    const doctorsWithStatus = pendingDoctors.map(doctor => ({
      ...doctor.toObject(),
      verificationStatus: {
        documentsUploaded: !!(doctor.documents?.license && doctor.documents?.degree && doctor.documents?.photo && doctor.documents?.idProof),
        phoneInterviewRequired: true,
        profileComplete: doctor.profileCompleteness >= 80,
        readyForApproval: !!(doctor.documents?.license && doctor.documents?.degree && doctor.documents?.photo && doctor.documents?.idProof) && doctor.profileCompleteness >= 80
      }
    }));
    
    res.json(doctorsWithStatus);
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