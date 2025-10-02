const express = require('express');
const router = express.Router();
const User = require('../models/User');
const nodemailer = require('nodemailer');
const subscriptionController = require('../controllers/subscriptionController');

// Subscribe to a plan (for any type)
router.post('/subscribe', async (req, res) => {
  const { userId, planType } = req.body;
  if (!userId || !planType) return res.status(400).json({ error: 'User ID and plan type required' });

  // Find plan details
  const plans = [
    {
      _id: 'pets',
      name: 'Pet Owner Subscription',
      description: 'Low price yearly plan for pet owners. Includes basic vet consultations and record management.',
      price: 299,
      type: 'pets',
    },
    {
      _id: 'farmer',
      name: 'Farmer Subscription',
      description: 'Yearly plan for farmers (cow, buffalo, goat, etc). Includes priority booking and unlimited reports.',
      price: 999,
      type: 'farmer',
    },
    {
      _id: 'dairy',
      name: 'Dairy/Large Scale Subscription',
      description: 'High price yearly plan for dairies and large scale animal owners. Includes all premium features.',
      price: 2999,
      type: 'dairy',
    }
  ];
  const plan = plans.find(p => p.type === planType);
  if (!plan) return res.status(400).json({ error: 'Invalid plan type' });

  // Update user subscription
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);
  const user = await User.findByIdAndUpdate(
    userId,
    { subscriptionTier: planType, subscriptionExpiry: expiry },
    { new: true }
  ).select('-password');
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Send email to user and admin
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'VetCare Subscription Activated',
      text: `Dear ${user.name},\nYour VetCare subscription (${plan.name}) is now active until ${expiry.toDateString()}. Thank you for choosing us!`,
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Subscription Purchased',
      text: `User ${user.name} (${user.email}) has purchased a ${plan.name} for ₹${plan.price}.`,
    });
  } catch (err) {
    // Log but don't fail
  }

  res.json({ success: true, user });
});
// Subscription plans (static for now)
router.get('/plans', (req, res) => {
  res.json([
    {
      _id: 'pets',
      name: 'Pet Owner Subscription',
      description: 'Low price yearly plan for pet owners. Includes basic vet consultations and record management.',
      price: 299,
      type: 'pets',
    },
    {
      _id: 'farmer',
      name: 'Farmer Subscription',
      description: 'Yearly plan for farmers (cow, buffalo, goat, etc). Includes priority booking and unlimited reports.',
      price: 999,
      type: 'farmer',
    },
    {
      _id: 'dairy',
      name: 'Dairy/Large Scale Subscription',
      description: 'High price yearly plan for dairies and large scale animal owners. Includes all premium features.',
      price: 2999,
      type: 'dairy',
    }
  ]);
});

// Upgrade farmer to premium (with email notification)
router.post('/farmer/upgrade', subscriptionController.upgradeSubscription);

// Doctor subscription/commission update
router.post('/doctor/update', async (req, res) => {
  const { doctorId, commissionRate, subscriptionActive } = req.body;
  if (!doctorId) return res.status(400).json({ error: 'Doctor ID required' });

  const doctor = await Doctor.findByIdAndUpdate(
    doctorId,
    { commissionRate, subscriptionActive },
    { new: true }
  );

  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
  res.json({ success: true, doctor });
});

module.exports = router;
