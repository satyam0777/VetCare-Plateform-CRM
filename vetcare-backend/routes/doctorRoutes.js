const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');

// @route   GET /api/doctors/verify-access/:token
// @desc    Verify doctor access link and return doctor data
// @access  Public (but secured by unique token)
router.get('/verify-access/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find doctor by unique access link
    const doctor = await Doctor.findOne({ 
      uniqueAccessLink: token,
      approved: true,
      status: 'active'
    });

    if (!doctor) {
      return res.status(403).json({ 
        valid: false,
        error: 'Invalid or expired access link. Please contact admin for assistance.' 
      });
    }

    res.json({
      valid: true,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        phone: doctor.phone,
        status: doctor.status,
        approved: doctor.approved
      }
    });
  } catch (error) {
    console.error('❌ Error verifying doctor access:', error);
    res.status(500).json({ 
      valid: false,
      error: 'Server error while verifying access' 
    });
  }
});

// Delete doctor by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedDoctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!deletedDoctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.status(200).json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
