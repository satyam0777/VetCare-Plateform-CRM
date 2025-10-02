// Admin notification endpoint (doctor approval, appointment updates)
exports.adminNotifications = async (req, res) => {
  try {
    // Example: fetch pending doctors and recent appointments
    const Doctor = require('../models/Doctor');
    const Appointment = require('../models/Appointment');
    const pendingDoctors = await Doctor.find({ approved: false });
    const recentAppointments = await Appointment.find().sort({ createdAt: -1 }).limit(10);
    res.json({ pendingDoctors, recentAppointments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};
const Doctor = require('../models/Doctor');
// Doctor login via unique access link
exports.doctorLinkLogin = async (req, res) => {
  const { link, password } = req.body;
  try {
    const doctor = await Doctor.findOne({ uniqueAccessLink: link, approved: true });
    if (!doctor) {
      return res.status(404).json({ error: 'Invalid or expired link' });
    }
    
    // For now, allow login if link matches
    // You can add bcrypt password check here
    // Generate JWT token for doctor
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: doctor._id, role: 'doctor' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { ...doctor.toObject(), token } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({ name, email, password: hashedPassword, role });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).send('Server error');
  }
};
// This code defines the authentication controller for a veterinary care application.
// It includes functions for user registration and login, handling user data securely with password hashing and JWT token generation.
// The `register` function checks if a user already exists, hashes the password, saves the user to the database, and returns a JWT token.
// The `login` function verifies the user's credentials, compares the password with the hashed version, and returns a JWT token if successful.
// This setup is essential for managing user authentication and authorization in the application, allowing users to securely access their accounts and perform actions based on their roles (patient, doctor, admin).
// The use of JWT tokens ensures that user sessions are secure and can be easily managed across different parts of the application.