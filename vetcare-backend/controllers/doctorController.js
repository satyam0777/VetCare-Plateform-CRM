
const Doctor = require('../models/Doctor');

// Generate and send unique access link to approved doctor
exports.sendAccessLink = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    if (!doctor.approved) {
      return res.status(400).json({ error: 'Doctor is not approved yet' });
    }
    if (!doctor.uniqueAccessLink) {
      doctor.generateAccessLink();
      await doctor.save();
    }
    
    res.json({ link: doctor.uniqueAccessLink });
  } catch (err) {
    console.error('Error generating access link:', err);
    res.status(500).json({ error: 'Failed to generate access link' });
  }
};

exports.getDoctors = async (req, res) => {
  try {
    // Only return approved doctors
    const doctors = await Doctor.find({ approved: true });
    res.json(doctors);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.addDoctor = async (req, res) => {
  const { name, specialization, experience, contact, availableSlots } = req.body;
  try {
    const doctor = new Doctor({ name, specialization, experience, contact, availableSlots });
    await doctor.save();
    res.status(201).json(doctor);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// Remove doctor by ID (admin)
exports.removeDoctor = async (req, res) => {
  try {
    const deletedDoctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!deletedDoctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.status(200).json({ message: 'Doctor deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete doctor' });
  }
};
// This code defines the doctor controller for a veterinary care application.
// It includes functions for retrieving a list of doctors and adding a new doctor to the database. 
// The `getDoctors` function fetches all doctors from the database and returns them as a JSON response.
// The `addDoctor` function creates a new doctor with the provided details and saves it to the database, returning the newly created doctor as a JSON response.
// This setup is essential for managing doctor data within the application, allowing users to view available doctors and enabling administrators to add new doctors as needed.
// The controller handles errors gracefully, responding with a 500 status code if any issues occur during database operations.