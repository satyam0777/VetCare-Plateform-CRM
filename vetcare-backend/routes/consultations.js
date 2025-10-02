const express = require('express');
const router = express.Router();
const Consultation = require('../models/Consultation');
const Doctor = require('../models/Doctor');
const Animal = require('../models/Animal');
const { auth } = require('../middleware/authMiddleware');

// Helper function to check if user is admin
const isAdminUser = (userId, userRole) => {
  return userId === 'admin' || userRole === 'admin';
};

// @route   POST /api/consultations
// @desc    Book new consultation
// @access  Private (Farmers only)
router.post('/', auth, async (req, res) => {
  try {
    // Handle admin users - they cannot book consultations
    if (isAdminUser(req.user, req.userRole)) {
      return res.status(403).json({ 
        message: 'Admin users cannot book consultations' 
      });
    }
    
    const { doctorId, animalId, scheduledDate, scheduledTime, symptoms, description, urgencyLevel } = req.body;
    
    // Verify doctor is available
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.approved || !doctor.isAvailable) {
      return res.status(400).json({ message: 'Doctor is not available for consultation' });
    }
    
    // Verify animal belongs to farmer
    const animal = await Animal.findOne({ _id: animalId, owner: req.user });
    if (!animal) {
      return res.status(400).json({ message: 'Animal not found or unauthorized' });
    }
    
    const consultation = new Consultation({
      farmer: req.user,
      doctor: doctorId,
      animal: animalId,
      scheduledDate,
      scheduledTime,
      symptoms,
      description,
      urgencyLevel: urgencyLevel || 'medium'
    });
    
    await consultation.save();
    await consultation.populate([
      { path: 'doctor', select: 'name specialization email mobile isOnline' },
      { path: 'animal', select: 'name type breed age' },
      { path: 'farmer', select: 'name email mobile' }
    ]);
    
    res.status(201).json(consultation);
  } catch (error) {
    console.error('Error booking consultation:', error);
    res.status(500).json({ message: 'Failed to book consultation' });
  }
});

// @route   GET /api/consultations
// @desc    Get user's consultations
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Handle admin users - they don't have personal consultations
    if (isAdminUser(req.user, req.userRole)) {
      return res.json([]);
    }
    
    const { status, upcoming } = req.query;
    let query = {};
    
    // Determine user role and set appropriate filter
    const user = await require('../models/User').findById(req.user);
    if (user.role === 'farmer') {
      query.farmer = req.user;
    } else if (user.role === 'doctor') {
      // Find doctor document for this user
      const doctor = await Doctor.findOne({ email: user.email });
      if (doctor) {
        query.doctor = doctor._id;
      }
    }
    
    // Apply filters
    if (status) {
      query.status = status;
    }
    
    if (upcoming === 'true') {
      query.scheduledDate = { $gte: new Date() };
    }
    
    const consultations = await Consultation.find(query)
      .populate('doctor', 'name specialization email mobile isOnline rating')
      .populate('animal', 'name type breed age healthStatus images')
      .populate('farmer', 'name email mobile farmLocation')
      .sort({ scheduledDate: -1, scheduledTime: -1 });
    
    res.json(consultations);
  } catch (error) {
    console.error('Error fetching consultations:', error);
    res.status(500).json({ message: 'Failed to fetch consultations' });
  }
});

// @route   GET /api/consultations/:id
// @desc    Get consultation details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate('doctor', 'name specialization email mobile isOnline rating')
      .populate('animal', 'name type breed age weight healthStatus images vaccinations')
      .populate('farmer', 'name email mobile farmLocation');
    
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }
    
    res.json(consultation);
  } catch (error) {
    console.error('Error fetching consultation:', error);
    res.status(500).json({ message: 'Failed to fetch consultation details' });
  }
});

// @route   PUT /api/consultations/:id/status
// @desc    Update consultation status
// @access  Private (Doctor only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, diagnosis, treatment, prescriptions, doctorNotes } = req.body;
    
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }
    
    // Update consultation
    consultation.status = status;
    if (diagnosis) consultation.diagnosis = diagnosis;
    if (treatment) consultation.treatment = treatment;
    if (prescriptions) consultation.prescriptions = prescriptions;
    if (doctorNotes) consultation.doctorNotes = doctorNotes;
    
    if (status === 'in_progress' && !consultation.startedAt) {
      consultation.startedAt = new Date();
    }
    
    if (status === 'completed' && !consultation.endedAt) {
      consultation.endedAt = new Date();
      if (consultation.startedAt) {
        consultation.duration = Math.round((consultation.endedAt - consultation.startedAt) / (1000 * 60)); // minutes
      }
      
      // Update doctor statistics
      await Doctor.findByIdAndUpdate(consultation.doctor, {
        $inc: { completedConsultations: 1 }
      });
    }
    
    await consultation.save();
    await consultation.populate([
      { path: 'doctor', select: 'name specialization' },
      { path: 'animal', select: 'name type' },
      { path: 'farmer', select: 'name email' }
    ]);
    
    res.json(consultation);
  } catch (error) {
    console.error('Error updating consultation:', error);
    res.status(500).json({ message: 'Failed to update consultation' });
  }
});

// @route   POST /api/consultations/:id/rating
// @desc    Rate consultation (Farmer only)
// @access  Private
router.post('/:id/rating', auth, async (req, res) => {
  try {
    // Handle admin users - they cannot rate consultations
    if (isAdminUser(req.user, req.userRole)) {
      return res.status(403).json({ 
        message: 'Admin users cannot rate consultations' 
      });
    }
    
    const { rating, review } = req.body;
    
    const consultation = await Consultation.findOneAndUpdate(
      { _id: req.params.id, farmer: req.user },
      { rating, review },
      { new: true }
    );
    
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found or unauthorized' });
    }
    
    // Update doctor's overall rating
    const consultations = await Consultation.find({ 
      doctor: consultation.doctor, 
      rating: { $exists: true, $ne: null } 
    });
    
    if (consultations.length > 0) {
      const avgRating = consultations.reduce((sum, c) => sum + c.rating, 0) / consultations.length;
      await Doctor.findByIdAndUpdate(consultation.doctor, {
        rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        totalReviews: consultations.length
      });
    }
    
    res.json(consultation);
  } catch (error) {
    console.error('Error rating consultation:', error);
    res.status(500).json({ message: 'Failed to rate consultation' });
  }
});

module.exports = router;