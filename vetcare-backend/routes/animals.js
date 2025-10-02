const express = require('express');
const router = express.Router();
const Animal = require('../models/Animal');
const User = require('../models/User');
const { auth } = require('../middleware/authMiddleware');

// @route   POST /api/animals
// @desc    Add new animal
// @access  Private (Farmers only)
router.post('/', auth, async (req, res) => {
  try {
    const animal = new Animal({
      ...req.body,
      owner: req.user // from auth middleware
    });
    
    await animal.save();
    await animal.populate('owner', 'name email mobile');
    
    res.status(201).json(animal);
  } catch (error) {
    console.error('Error creating animal:', error);
    res.status(500).json({ message: 'Failed to add animal' });
  }
});

// @route   GET /api/animals
// @desc    Get farmer's animals
// @access  Private (Farmers only)
router.get('/', auth, async (req, res) => {
  try {
    const animals = await Animal.find({ 
      owner: req.user,
      isActive: true 
    }).populate('owner', 'name email mobile');
    
    res.json(animals);
  } catch (error) {
    console.error('Error fetching animals:', error);
    res.status(500).json({ message: 'Failed to fetch animals' });
  }
});

// @route   GET /api/animals/:id
// @desc    Get single animal details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id)
      .populate('owner', 'name email mobile')
      .populate('vaccinations.givenBy', 'name specialization');
    
    if (!animal) {
      return res.status(404).json({ message: 'Animal not found' });
    }
    
    res.json(animal);
  } catch (error) {
    console.error('Error fetching animal:', error);
    res.status(500).json({ message: 'Failed to fetch animal details' });
  }
});

// @route   PUT /api/animals/:id
// @desc    Update animal details
// @access  Private (Owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const animal = await Animal.findOneAndUpdate(
      { _id: req.params.id, owner: req.user },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!animal) {
      return res.status(404).json({ message: 'Animal not found or unauthorized' });
    }
    
    res.json(animal);
  } catch (error) {
    console.error('Error updating animal:', error);
    res.status(500).json({ message: 'Failed to update animal' });
  }
});

// @route   DELETE /api/animals/:id
// @desc    Soft delete animal
// @access  Private (Owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const animal = await Animal.findOneAndUpdate(
      { _id: req.params.id, owner: req.user },
      { isActive: false },
      { new: true }
    );
    
    if (!animal) {
      return res.status(404).json({ message: 'Animal not found or unauthorized' });
    }
    
    res.json({ message: 'Animal removed successfully' });
  } catch (error) {
    console.error('Error deleting animal:', error);
    res.status(500).json({ message: 'Failed to remove animal' });
  }
});

// @route   POST /api/animals/:id/vaccination
// @desc    Add vaccination record
// @access  Private (Doctors only)
router.post('/:id/vaccination', auth, async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);
    if (!animal) {
      return res.status(404).json({ message: 'Animal not found' });
    }
    
    animal.vaccinations.push({
      ...req.body,
      givenBy: req.user
    });
    
    await animal.save();
    res.json(animal);
  } catch (error) {
    console.error('Error adding vaccination:', error);
    res.status(500).json({ message: 'Failed to add vaccination record' });
  }
});

module.exports = router;