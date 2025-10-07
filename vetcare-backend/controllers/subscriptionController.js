const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

// Upgrade user subscription and notify admin + user
exports.upgradeSubscription = async (req, res) => {
  const { userId, tier, expiry } = req.body;
  if (!userId || !tier) return res.status(400).json({ error: 'User ID and tier required' });

  const user = await User.findByIdAndUpdate(
    userId,
    { subscriptionTier: tier, subscriptionExpiry: expiry || null },
    { new: true }
  ).select('-password');

  if (!user) return res.status(404).json({ error: 'User not found' });

  // Send email to user
  try {
    await sendEmail({
      to: user.email,
      subject: 'VetCare Subscription Activated',
      text: `Dear ${user.name},\nYour VetCare subscription (${tier}) is now active. Thank you for choosing us!`,
    });
  } catch (err) {
    // Log but don't fail
  }

  // Send email to admin
  try {
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: 'New Subscription Purchased',
      text: `User ${user.name} (${user.email}) has purchased a ${tier} subscription.`,
    });
  } catch (err) {
    // Log but don't fail
  }

  res.json({ success: true, user });
};
