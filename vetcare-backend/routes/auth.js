
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authController = require('../controllers/authController');

// @route   POST /api/auth/request-reactivation
// @desc    User requests account reactivation with a reason
// @access  Public (user must provide email and reason)
router.post('/request-reactivation', async (req, res) => {
  try {
    const { email, reason } = req.body;
    if (!email || !reason || reason.trim().length < 3) {
      return res.status(400).json({ error: 'Email and valid reason are required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (user.isActive) {
      return res.status(400).json({ error: 'Account is already active.' });
    }
    user.reactivationRequest = {
      requested: true,
      reason,
      requestedAt: new Date(),
      status: 'pending',
      adminResponse: null,
      respondedAt: null
    };
    await user.save();
    // Optionally: send notification to admin here
    res.json({ success: true, message: 'Reactivation request submitted.' });
  } catch (error) {
    console.error('Error in reactivation request:', error);
    res.status(500).json({ error: 'Failed to submit reactivation request.' });
  }
});

// Admin Forgot Password - send code to admin email
router.post('/admin/forgot-password', async (req, res) => {
  const { email } = req.body;
  const Admin = require('../models/Admin');
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: 'No admin found with this email' });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    admin.resetPasswordCode = code;
    admin.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 min expiry
    await admin.save();

    // Send code via email
    const emailService = require('../services/emailService');
    console.log('📧 [ROUTE] Sending admin password reset code to:', admin.email);
    const emailResult = await emailService.sendEmail({
      to: admin.email,
      subject: 'VetCare Admin Password Reset Code',
      html: `
        <div style="font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001;">
          <div style="background:linear-gradient(135deg,#7c3aed 0%,#f472b6 100%);padding:32px 24px;text-align:center;color:#fff;">
            <h2 style="margin-bottom:8px;">Admin Password Reset Request</h2>
            <div style="font-size:18px;">VetCare Platform</div>
          </div>
          <div style="padding:32px 24px;">
            <p style="font-size:16px;">Dear Admin,</p>
            <p>We received a request to reset your VetCare admin password. Use the code below to proceed:</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:6px;background:#f3f4f6;padding:18px 0;margin:24px 0 18px 0;border-radius:10px;color:#7c3aed;">${code}</div>
            <p style="color:#6b7280;font-size:14px;">This code will expire in 15 minutes. If you did not request this, please contact support immediately.</p>
            <a href="mailto:support@vetcare.com" style="display:inline-block;margin-top:18px;color:#fff;background:#7c3aed;padding:10px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Contact Support</a>
          </div>
          <div style="background:#f3f4f6;color:#6b7280;padding:18px;text-align:center;font-size:13px;">VetCare Professional Platform</div>
        </div>
      `
    });

  console.log('📧 [ROUTE] Email result:', emailResult);
  res.json({ message: 'Admin password reset code sent to email' });
  } catch (error) {
    console.error('Admin forgot password error:', error);
    res.status(500).json({ message: 'Error sending admin reset code' });
  }
});

// Admin Reset Password - verify code and set new password
router.post('/admin/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  const Admin = require('../models/Admin');
  try {
    const admin = await Admin.findOne({ email });
    if (!admin || !admin.resetPasswordCode || !admin.resetPasswordExpires) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }
    if (admin.resetPasswordCode !== code || admin.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    admin.password = await bcrypt.hash(newPassword, 12);
    admin.resetPasswordCode = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    // Send password reset notification
    const emailService = require('../services/emailService');
    try {
      await emailService.sendEmail({
        to: admin.email,
        subject: 'VetCare Admin Password Reset Successful',
        html: `
          <div style="font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001;">
            <div style="background:linear-gradient(135deg,#7c3aed 0%,#f472b6 100%);padding:32px 24px;text-align:center;color:#fff;">
              <h2 style="margin-bottom:8px;">Admin Password Reset Successful</h2>
              <div style="font-size:18px;">VetCare Platform</div>
            </div>
            <div style="padding:32px 24px;">
              <p style="font-size:16px;">Dear Admin,</p>
              <p>Your VetCare admin password was successfully reset at <b>${new Date().toLocaleString()}</b>.</p>
              <p style="color:#6b7280;font-size:14px;">If you did not perform this action, please contact support immediately.</p>
              <a href="mailto:support@vetcare.com" style="display:inline-block;margin-top:18px;color:#fff;background:#7c3aed;padding:10px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Contact Support</a>
            </div>
            <div style="background:#f3f4f6;color:#6b7280;padding:18px;text-align:center;font-size:13px;">VetCare Professional Platform</div>
          </div>
        `
      });
    } catch (e) {
      console.error('Failed to send admin password reset notification:', e);
    }

    res.json({ message: 'Admin password reset successful' });
  } catch (error) {
    console.error('Admin reset password error:', error);
    res.status(500).json({ message: 'Error resetting admin password' });
  }
});

// Forgot Password - send code to email
// (router is now initialized at the top)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No user found with this email' });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordCode = code;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 min expiry
    await user.save();

    // Send code via email
    const emailService = require('../services/emailService');
    console.log('📧 [ROUTE] Sending user password reset code to:', user.email);
    const emailResult = await emailService.sendEmail({
      to: user.email,
      subject: 'VetCare Password Reset Code',
      html: `
        <div style="font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001;">
          <div style="background:linear-gradient(135deg,#059669 0%,#f472b6 100%);padding:32px 24px;text-align:center;color:#fff;">
            <h2 style="margin-bottom:8px;">Password Reset Request</h2>
            <div style="font-size:18px;">VetCare Platform</div>
          </div>
          <div style="padding:32px 24px;">
            <p style="font-size:16px;">Dear User,</p>
            <p>We received a request to reset your VetCare password. Use the code below to proceed:</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:6px;background:#f3f4f6;padding:18px 0;margin:24px 0 18px 0;border-radius:10px;color:#059669;">${code}</div>
            <p style="color:#6b7280;font-size:14px;">This code will expire in 15 minutes. If you did not request this, please contact support immediately.</p>
            <a href="mailto:support@vetcare.com" style="display:inline-block;margin-top:18px;color:#fff;background:#059669;padding:10px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Contact Support</a>
          </div>
          <div style="background:#f3f4f6;color:#6b7280;padding:18px;text-align:center;font-size:13px;">VetCare Professional Platform</div>
        </div>
      `
    });

  console.log('📧 [ROUTE] Email result:', emailResult);
  res.json({ message: 'Password reset code sent to email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error sending reset code' });
  }
});

// Reset Password - verify code and set new password
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordCode || !user.resetPasswordExpires) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }
    if (user.resetPasswordCode !== code || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send password reset confirmation email
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: 'VetCare Password Reset Successful',
        html: `
          <div style="font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001;">
            <div style="background:linear-gradient(135deg,#059669 0%,#f472b6 100%);padding:32px 24px;text-align:center;color:#fff;">
              <h2 style="margin-bottom:8px;">Password Reset Successful</h2>
              <div style="font-size:18px;">VetCare Platform</div>
            </div>
            <div style="padding:32px 24px;">
              <p style="font-size:16px;">Dear User,</p>
              <p>Your VetCare password was successfully reset at <b>${new Date().toLocaleString()}</b>.</p>
              <p style="color:#6b7280;font-size:14px;">If you did not perform this action, please contact support immediately.</p>
              <a href="mailto:support@vetcare.com" style="display:inline-block;margin-top:18px;color:#fff;background:#059669;padding:10px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Contact Support</a>
            </div>
            <div style="background:#f3f4f6;color:#6b7280;padding:18px;text-align:center;font-size:13px;">VetCare Professional Platform</div>
          </div>
        `
      });
    } catch (e) {
      console.error('Failed to send user password reset notification:', e);
    }
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// Admin notifications (doctor approval, appointment updates)
router.get('/admin-notifications', authController.adminNotifications);
// Doctor login via unique access link
router.post('/doctor-link-login', authController.doctorLinkLogin);

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Auth routes are working!" });
});

// Register route
router.post("/register", async (req, res) => {
  const { name, email, mobile, password, petName, role } = req.body;

  try {
    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const user = new User({
      name,
      email,
      mobile,
      password: hashedPassword,
      petName: petName || '',
      role: role || 'user',
    });

    await user.save();

    // Add new user ID to all admins' userIds arrays
    const Admin = require('../models/Admin');
    await Admin.updateMany(
      {},
      { $addToSet: { userIds: user._id } }
    );

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    // Fetch full user info (excluding password)
    const userInfo = await User.findById(user._id).select('-password');

    // Send welcome email
    const emailService = require('../services/emailService');
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: 'Welcome to VetCare!',
        html: `
          <div style="font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001;">
            <div style="background:linear-gradient(135deg,#059669 0%,#2563eb 100%);padding:32px 24px;text-align:center;color:#fff;">
              <h2 style="margin-bottom:8px;">Welcome to VetCare!</h2>
              <div style="font-size:18px;">Your account has been created</div>
            </div>
            <div style="padding:32px 24px;">
              <p style="font-size:16px;">Dear ${user.name},</p>
              <p>Thank you for registering on VetCare. We’re excited to have you on board!</p>
              <p style="color:#6b7280;font-size:14px;">If you have any questions, contact us at <a href="mailto:support@vetcare.com">support@vetcare.com</a></p>
            </div>
            <div style="background:#f3f4f6;color:#6b7280;padding:18px;text-align:center;font-size:13px;">VetCare Professional Platform</div>
          </div>
        `
      });
    } catch (e) {
      console.error('Failed to send welcome email:', e);
    }
    // Send response
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: userInfo,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Login route (admin and user)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const Admin = require('../models/Admin');
  const emailService = require('../services/emailService');
  try {
    // Check admin first
    let admin = await Admin.findOne({ email });
    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
      const token = jwt.sign({ id: admin._id, email: admin.email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: "7d" });
      // Send admin login notification
      try {
        await emailService.sendEmail({
          to: admin.email,
          subject: 'VetCare Admin Login Notification',
          html: `<div style="font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001;"><div style="background:linear-gradient(135deg,#16a34a 0%,#059669 100%);padding:32px 24px;text-align:center;color:#fff;"><h2 style="margin-bottom:8px;">Admin Login Notification</h2><div style="font-size:18px;">VetCare Platform</div></div><div style="padding:32px 24px;"><p style="font-size:16px;">Dear ${admin.name || 'Admin'},</p><p>Your admin account was just logged in at <b>${new Date().toLocaleString()}</b>.</p><p style="color:#6b7280;font-size:14px;">If this wasn’t you, please reset your password immediately or contact support.</p><a href="mailto:support@vetcare.com" style="display:inline-block;margin-top:18px;color:#fff;background:#059669;padding:10px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Contact Support</a></div><div style="background:#f3f4f6;color:#6b7280;padding:18px;text-align:center;font-size:13px;">VetCare Professional Platform</div></div>`
        });
      } catch (e) {
        console.error('Failed to send admin login notification:', e);
      }
      return res.json({
        message: "Admin login successful",
        token,
        user: { name: admin.name, email: admin.email, role: 'admin' },
      });
    }
    // User login
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    const userInfo = await User.findById(user._id).select('-password');
    // Send login notification email
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: 'VetCare Login Notification',
        html: `<div style="font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001;"><div style="background:linear-gradient(135deg,#059669 0%,#2563eb 100%);padding:32px 24px;text-align:center;color:#fff;"><h2 style="margin-bottom:8px;">Login Notification</h2><div style="font-size:18px;">VetCare Platform</div></div><div style="padding:32px 24px;"><p style="font-size:16px;">Dear ${user.name},</p><p>Your account was just logged in at <b>${new Date().toLocaleString()}</b>.</p><p style="color:#6b7280;font-size:14px;">If this wasn’t you, please reset your password immediately or contact support.</p><a href="mailto:support@vetcare.com" style="display:inline-block;margin-top:18px;color:#fff;background:#059669;padding:10px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Contact Support</a></div><div style="background:#f3f4f6;color:#6b7280;padding:18px;text-align:center;font-size:13px;">VetCare Professional Platform</div></div>`
      });
    } catch (e) {
      console.error('Failed to send login notification email:', e);
    }
    res.json({
      message: "User login successful",
      token,
      user: userInfo,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Admin password change endpoint
router.post('/admin/change-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  const Admin = require('../models/Admin');
  const emailService = require('../services/emailService');
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    // Hash and update new password
    admin.password = await bcrypt.hash(newPassword, 12);
    await admin.save();

    // Send password change notification
    try {
      await emailService.sendEmail({
        to: admin.email,
        subject: 'VetCare Admin Password Changed',
        text: `Your admin password was changed at ${new Date().toLocaleString()}. If this was not you, please contact support immediately.`
      });
    } catch (e) {
      console.error('Failed to send admin password change notification:', e);
    }

    res.json({ message: 'Admin password changed successfully' });
  } catch (err) {
    console.error('Admin password change error:', err);
    res.status(500).json({ message: 'Error changing admin password' });
  }
});

module.exports = router;