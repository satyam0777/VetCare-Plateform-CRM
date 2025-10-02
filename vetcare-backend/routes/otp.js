const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// In-memory store for OTPs (use Redis in production)
const otpStore = {};

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via email
async function sendEmailOTP(email, otp) {
  // Configure your transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'VetCare OTP Verification',
    text: `Your OTP code is: ${otp}`
  });
}

// Request OTP
router.post('/request', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const otp = generateOTP();
  otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

  try {
    await sendEmailOTP(email, otp);
    res.json({ success: true, message: 'OTP sent to email' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send OTP', details: err.message });
  }
});

// Verify OTP
router.post('/verify', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

  const record = otpStore[email];
  if (!record || record.otp !== otp || Date.now() > record.expires) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  // Optionally, mark user as verified
  await User.findOneAndUpdate({ email }, { isVerified: true });
  delete otpStore[email];
  res.json({ success: true, message: 'OTP verified' });
});

module.exports = router;
