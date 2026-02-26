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
