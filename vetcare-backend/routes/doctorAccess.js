const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const jwt = require('jsonwebtoken');

// @route   GET /api/doctor-access/:token
// @desc    Verify doctor access token and provide login via URL
// @access  Public
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find doctor with this unique access link
    const doctor = await Doctor.findOne({ 
      uniqueAccessLink: token,
      approved: true,
      status: 'active'
    });

    if (!doctor) {
      return res.status(404).json({ 
        error: 'Invalid or expired access link. This account may have been removed or deactivated. Please contact admin.',
        code: 'DOCTOR_NOT_FOUND',
        redirectTo: '/contact' 
      });
    }

    // Generate JWT token for the doctor
    const authToken = jwt.sign(
      { 
        id: doctor._id, 
        role: 'doctor',
        email: doctor.email,
        name: doctor.name
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Update doctor's last login
    doctor.lastLoginAt = new Date();
    await doctor.save();

    console.log(`✅ Doctor ${doctor.name} accessed dashboard via link`);

    res.json({
      success: true,
      message: 'Access granted successfully',
      user: {
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        role: 'doctor',
        specialization: doctor.specialization,
        token: authToken,
        profileImage: doctor.profileImage,
        status: doctor.status
      }
    });
  } catch (error) {
    console.error('❌ Error verifying doctor access:', error);
    res.status(500).json({ error: 'Failed to verify access link' });
  }
});

// Doctor login via unique access link (legacy)
router.post('/login', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ error: 'Access token required' });

  try {
    const doctor = await Doctor.findOne({ 
      uniqueAccessLink: accessToken, 
      approved: true,
      status: 'active'
    });
    
    if (!doctor) {
      return res.status(401).json({ error: 'Invalid or expired access link' });
    }

    // Issue JWT for doctor
    const token = jwt.sign(
      { id: doctor._id, email: doctor.email, role: 'doctor' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login
    doctor.lastLoginAt = new Date();
    await doctor.save();

    res.json({ 
      success: true, 
      token, 
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        role: 'doctor',
        approved: doctor.approved,
        status: doctor.status
      }
    });
  } catch (error) {
    console.error('❌ Error in doctor login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// @route   POST /api/doctor-access/:token/setup
// @desc    Allow doctor to complete profile setup after first login
// @access  Doctor only (via token)
router.post('/:token/setup', async (req, res) => {
  try {
    const { token } = req.params;
    const { workingHours, bio, profileImage, languages } = req.body;
    
    const doctor = await Doctor.findOne({ 
      uniqueAccessLink: token,
      approved: true,
      status: 'active'
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Invalid access link' });
    }

    // Update doctor profile
    if (workingHours) doctor.workingHours = workingHours;
    if (bio) doctor.bio = bio;
    if (profileImage) doctor.profileImage = profileImage;
    if (languages) doctor.languages = languages;
    
    doctor.profileCompleted = true;
    doctor.profileCompletedAt = new Date();
    
    await doctor.save();

    res.json({
      success: true,
      message: 'Profile setup completed successfully',
      doctor: {
        id: doctor._id,
        name: doctor.name,
        profileCompleted: true
      }
    });
  } catch (error) {
    console.error('❌ Error completing doctor setup:', error);
    res.status(500).json({ error: 'Failed to complete profile setup' });
  }
});

module.exports = router;
