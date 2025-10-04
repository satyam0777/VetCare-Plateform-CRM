const express = require('express');
const { createUploadMiddleware } = require('../services/cloudStorageService');
const Doctor = require('../models/Doctor');
const { auth } = require('../middleware/authMiddleware');
const router = express.Router();


// Use Cloudinary upload middleware for doctor documents
const upload = createUploadMiddleware('cloudinary');

// Doctor application with documents
router.post('/apply', upload.fields([
  { name: 'license', maxCount: 1 },
  { name: 'degree', maxCount: 1 },
  { name: 'experience', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'idProof', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('--- Doctor Verification Upload Debug ---');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);
    const {
      name, email, phone, specialization, experience,
      licenseNumber, qualification, clinicAddress,
      consultationFee, bio
    } = req.body;

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ message: 'Doctor with this email already exists' });
    }


    // Prepare Cloudinary URLs for documents
    const documents = {};
    if (req.files) {
      if (req.files.license) documents.license = req.files.license[0].path || req.files.license[0].url;
      if (req.files.degree) documents.degree = req.files.degree[0].path || req.files.degree[0].url;
      if (req.files.experience) documents.experience = req.files.experience[0].path || req.files.experience[0].url;
      if (req.files.photo) documents.photo = req.files.photo[0].path || req.files.photo[0].url;
      if (req.files.idProof) documents.idProof = req.files.idProof[0].path || req.files.idProof[0].url;
    }

    // Create doctor with pending status
    const newDoctor = new Doctor({
      name,
      email,
      phone,
      specialization,
      experience: parseInt(experience),
      licenseNumber,
      qualification,
      clinicAddress,
      consultationFee: parseInt(consultationFee),
      bio,
      documents,
      verificationStatus: 'pending',
      documentsUploaded: {
        license: !!documents.license,
        degree: !!documents.degree,
        experience: !!documents.experience,
        photo: !!documents.photo
      },
      profileCompleteness: calculateProfileCompleteness({
        name, email, phone, specialization, experience,
        licenseNumber, qualification, consultationFee, bio,
        documents
      })
    });

    await newDoctor.save();

    res.status(201).json({
      message: 'Doctor application submitted successfully',
      doctorId: newDoctor._id,
      status: 'pending'
    });

  } catch (error) {
    console.error('Doctor application error:', error);
    res.status(500).json({ message: 'Application submission failed', error: error.message });
  }
});

// Get pending doctor applications (Admin only)
router.get('/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const pendingDoctors = await Doctor.find({ verificationStatus: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(pendingDoctors);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending applications', error: error.message });
  }
});

// Verify/Reject doctor (Admin only)
router.put('/verify/:doctorId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { action, notes } = req.body; // action: 'approve' or 'reject'
    
    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (action === 'approve') {
      doctor.verificationStatus = 'approved';
      doctor.isActive = true;
      doctor.verificationDate = new Date();
      doctor.verificationNotes = notes;
      
      // Generate unique access link
      doctor.uniqueLink = generateUniqueLink();
      
    } else if (action === 'reject') {
      doctor.verificationStatus = 'rejected';
      doctor.rejectionReason = notes;
      doctor.rejectionDate = new Date();
    }

    await doctor.save();

    // TODO: Send email notification to doctor
    // await sendVerificationEmail(doctor, action);

    res.json({
      message: `Doctor ${action}d successfully`,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        status: doctor.verificationStatus,
        uniqueLink: doctor.uniqueLink
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
});

// Get doctor verification status
router.get('/status/:doctorId', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId)
      .select('verificationStatus profileCompleteness documentsUploaded verificationNotes rejectionReason');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch status', error: error.message });
  }
});

// Helper function to calculate profile completeness
function calculateProfileCompleteness(data) {
  const requiredFields = ['name', 'email', 'phone', 'specialization', 'experience', 'licenseNumber', 'qualification', 'consultationFee'];
  const optionalFields = ['bio', 'clinicAddress'];
  const requiredDocs = ['license', 'degree', 'photo'];
  
  let score = 0;
  const totalPoints = requiredFields.length * 10 + optionalFields.length * 5 + requiredDocs.length * 10;
  
  // Required fields (10 points each)
  requiredFields.forEach(field => {
    if (data[field]) score += 10;
  });
  
  // Optional fields (5 points each)
  optionalFields.forEach(field => {
    if (data[field]) score += 5;
  });
  
  // Required documents (10 points each)
  if (data.documents) {
    requiredDocs.forEach(doc => {
      if (data.documents[doc]) score += 10;
    });
  }
  
  return Math.round((score / totalPoints) * 100);
}

// Helper function to generate unique doctor link
function generateUniqueLink() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

module.exports = router;