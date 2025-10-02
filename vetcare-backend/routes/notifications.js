const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const NotificationService = require('../services/notificationService');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper function to check if user is admin
const isAdminUser = (userId, userRole) => {
  return userId === 'admin' || userRole === 'admin';
};

// Helper function to handle admin users in queries
const handleAdminUserQuery = (userId, userRole, defaultResponse = []) => {
  if (isAdminUser(userId, userRole)) {
    return { isAdmin: true, defaultResponse };
  }
  return { isAdmin: false, userId };
};

// @route   POST /api/notifications/register-device
// @desc    Register device for push notifications
// @access  Private
router.post('/register-device', auth, async (req, res) => {
  try {
    const { fcmToken, deviceType, deviceId } = req.body;
    const userId = req.user;

    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    // Update user's FCM token
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize devices array if not exists
    if (!user.devices) {
      user.devices = [];
    }

    // Check if device already exists
    const existingDevice = user.devices.find(device => device.deviceId === deviceId);
    
    if (existingDevice) {
      // Update existing device
      existingDevice.fcmToken = fcmToken;
      existingDevice.lastActive = new Date();
      existingDevice.isActive = true;
    } else {
      // Add new device
      user.devices.push({
        deviceId,
        fcmToken,
        deviceType: deviceType || 'web',
        isActive: true,
        registeredAt: new Date(),
        lastActive: new Date()
      });
    }

    await user.save();

    // Send welcome notification
    await NotificationService.sendNotification(userId, {
      title: '🔔 Notifications Enabled!',
      body: 'You will now receive important updates about your appointments and consultations.',
      type: 'system',
      data: {
        category: 'welcome',
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: 'Device registered for notifications successfully',
      deviceCount: user.devices.length
    });

  } catch (error) {
    console.error('❌ Error registering device:', error);
    res.status(500).json({ error: 'Failed to register device for notifications' });
  }
});

// @route   POST /api/notifications/send
// @desc    Send notification to specific user (Admin only)
// @access  Private
router.post('/send', auth, async (req, res) => {
  try {
    const { userId, title, body, type = 'custom', data = {} } = req.body;
    
    // Check if sender is admin
    const sender = await User.findById(req.user);
    if (sender.role !== 'admin' && sender.role !== 'owner') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Validate recipient
    const recipient = await User.findById(userId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Send notification
    const result = await NotificationService.sendNotification(userId, {
      title,
      body,
      type,
      data: {
        ...data,
        sentBy: 'admin',
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: 'Notification sent successfully',
      notificationId: result.notificationId,
      deliveryStatus: result.success ? 'delivered' : 'failed'
    });

  } catch (error) {
    console.error('❌ Error occurred:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// @route   POST /api/notifications/broadcast
// @desc    Send notification to all users or specific role
// @access  Private (Admin only)
router.post('/broadcast', auth, async (req, res) => {
  try {
    const { title, body, targetRole = 'all', type = 'announcement', data = {} } = req.body;
    
    // Check if sender is admin
    const sender = await User.findById(req.user);
    if (sender.role !== 'admin' && sender.role !== 'owner') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get target users
    let targetUsers;
    if (targetRole === 'all') {
      targetUsers = await User.find({ 
        'devices.isActive': true 
      }).select('_id devices');
    } else {
      targetUsers = await User.find({ 
        role: targetRole,
        'devices.isActive': true 
      }).select('_id devices');
    }

    if (targetUsers.length === 0) {
      return res.status(400).json({ error: 'No active users found for broadcast' });
    }

    // Send to all target users
    const results = await Promise.allSettled(
      targetUsers.map(user => 
        NotificationService.sendNotification(user._id, {
          title,
          body,
          type,
          data: {
            ...data,
            broadcast: true,
            targetRole,
            sentBy: 'admin',
            timestamp: new Date().toISOString()
          }
        })
      )
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: true,
      message: 'Broadcast completed',
      stats: {
        totalTargets: targetUsers.length,
        successful: successCount,
        failed: failureCount,
        successRate: `${Math.round((successCount / targetUsers.length) * 100)}%`
      }
    });

  } catch (error) {
    console.error('❌ Error occurred:', error);
    res.status(500).json({ error: 'Failed to broadcast notification' });
  }
});

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user;
    
    // Handle admin users - they don't have personal notifications
    const userQuery = handleAdminUserQuery(userId, req.userRole, []);
    if (userQuery.isAdmin) {
      return res.json({
        success: true,
        notifications: userQuery.defaultResponse,
        totalCount: 0,
        unreadCount: 0,
        currentPage: parseInt(page),
        totalPages: 0
      });
    }
    
    const filter = { recipient: userQuery.userId };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('relatedEntities.appointment', 'petName date time')
      .lean();
    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });
    // Map notifications to match frontend expectations
    const mappedNotifications = notifications.map(notif => ({
      _id: notif._id,
      title: notif.title,
      body: notif.message, // Map 'message' field to 'body' for frontend
      type: notif.type,
      isRead: notif.isRead,
      priority: notif.priority,
      data: notif.data,
      createdAt: notif.createdAt,
      relatedAppointment: notif.relatedEntities?.appointment
    }));

    console.log('✅ Returning', mappedNotifications.length, 'notifications');

    res.json({
      notifications: mappedNotifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalNotifications: total,
        unreadCount
      }
    });

  } catch (error) {
    console.error('❌ Error occurred:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user;
    
    // Handle admin users - they don't have notifications to mark as read
    if (isAdminUser(userId, req.userRole)) {
      return res.json({
        success: true,
        message: 'Admin users do not have personal notifications'
      });
    }
    
    const notification = await Notification.findOne({
      _id: id,
      recipient: userId
    });

    if (!notification) {
      console.log('ℹ️ Info logged');
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    console.log('✅ Notification marked as read successfully');

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('❌ Error occurred:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// @route   PATCH /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.patch('/read-all', auth, async (req, res) => {
  try {
    const userId = req.user;
    
    // Handle admin users - they don't have notifications to mark as read
    if (isAdminUser(userId, req.userRole)) {
      return res.json({
        success: true,
        message: 'Admin users do not have personal notifications',
        updatedCount: 0
      });
    }
    
    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    console.log('✅ Updated', result.modifiedCount, 'notifications');

    res.json({
      success: true,
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('❌ Error occurred:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get count of unread notifications
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user;

    // Handle admin users - they don't have notification counts
    if (isAdminUser(userId, req.userRole)) {
      return res.json({
        success: true,
        count: 0
      });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });

    res.json({
      success: true,
      count: unreadCount
    });

  } catch (error) {
    console.error('❌ Error occurred:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user;
    
    // Handle admin users - they don't have notifications to delete
    if (isAdminUser(userId, req.userRole)) {
      return res.status(404).json({ 
        error: 'Admin users do not have personal notifications' 
      });
    }
    
    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId
    });

    if (!notification) {
      console.log('ℹ️ Info logged');
      return res.status(404).json({ error: 'Notification not found' });
    }

    console.log('✅ Notification deleted successfully');

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error occurred:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// @route   GET /api/notifications/preferences
// @desc    Get user notification preferences
// @access  Private
router.get('/preferences', auth, async (req, res) => {
  try {
    const userId = req.user;
    
    // Handle admin users - they don't have notification preferences
    if (isAdminUser(userId, req.userRole)) {
      const defaultAdminPreferences = {
        pushNotifications: false,
        emailNotifications: false,
        appointmentReminders: false,
        appointmentUpdates: false,
        paymentNotifications: false,
        promotionalEmails: false,
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00'
        }
      };
      
      return res.json({
        preferences: defaultAdminPreferences,
        deviceCount: 0
      });
    }
    
    const user = await User.findById(userId).select('notificationPreferences');

    const defaultPreferences = {
      pushNotifications: true,
      emailNotifications: true,
      appointmentReminders: true,
      appointmentUpdates: true,
      paymentNotifications: true,
      promotionalEmails: false,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
      }
    };

    const preferences = user.notificationPreferences || defaultPreferences;

    res.json({
      preferences,
      deviceCount: user.devices ? user.devices.filter(d => d.isActive).length : 0
    });

  } catch (error) {
    console.error('❌ Error occurred:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

// @route   PUT /api/notifications/preferences
// @desc    Update user notification preferences
// @access  Private
router.put('/preferences', auth, async (req, res) => {
  try {
    const userId = req.user;
    const preferences = req.body;

    // Handle admin users - they cannot update notification preferences
    if (isAdminUser(userId, req.userRole)) {
      return res.status(403).json({ 
        error: 'Admin users do not have notification preferences to update' 
      });
    }

    const user = await User.findById(userId);
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...preferences
    };

    await user.save();

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences: user.notificationPreferences
    });

  } catch (error) {
    console.error('❌ Error occurred:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// @route   GET /api/notifications/analytics
// @desc    Get notification analytics (Admin only)
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    // Handle admin users - they should have access to analytics
    if (!isAdminUser(req.user, req.userRole)) {
      const user = await User.findById(req.user);
      if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    const { period = '30' } = req.query;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(period));

    // Notification statistics
    const notificationStats = await Notification.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type'
          },
          count: { $sum: 1 },
          readCount: {
            $sum: { $cond: [{ $eq: ['$isRead', true] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Device statistics
    const deviceStats = await User.aggregate([
      {
        $unwind: '$devices'
      },
      {
        $match: {
          'devices.isActive': true
        }
      },
      {
        $group: {
          _id: '$devices.deviceType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Overall stats
    const totalNotifications = await Notification.countDocuments({
      createdAt: { $gte: fromDate }
    });

    const readRate = await Notification.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          read: { $sum: { $cond: [{ $eq: ['$isRead', true] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      period: parseInt(period),
      totalNotifications,
      readRate: readRate[0] ? Math.round((readRate[0].read / readRate[0].total) * 100) : 0,
      notificationsByTypeAndDate: notificationStats,
      activeDevicesByType: deviceStats,
      summary: {
        averageNotificationsPerDay: Math.round(totalNotifications / parseInt(period)),
        totalActiveDevices: deviceStats.reduce((sum, stat) => sum + stat.count, 0)
      }
    });

  } catch (error) {
    console.error('❌ Error occurred:', error);
    res.status(500).json({ error: 'Failed to fetch notification analytics' });
  }
});

// @route   POST /api/notifications/create-test
// @desc    Create test notifications for development
// @access  Private
router.post('/create-test', auth, async (req, res) => {
  try {
    const userId = req.user;
    // Create sample notifications
    const testNotifications = [
      {
        recipient: userId,
        recipientRole: 'user',
        title: '🩺 Welcome to VetCare!',
        message: 'Your account has been successfully created. Start booking appointments with our expert veterinarians.',
        type: 'system_announcement',
        data: { source: 'system' },
        isRead: false
      },
      {
        recipient: userId,
        recipientRole: 'user',
        title: '📅 Appointment Reminder',
        message: 'You have an upcoming appointment with Dr. Smith tomorrow at 2:00 PM.',
        type: 'appointment_reminder',
        data: { appointmentId: 'sample_123' },
        isRead: false
      },
      {
        recipient: userId,
        recipientRole: 'user',
        title: '💳 Payment Successful',
        message: 'Your payment of ₹500 for consultation has been processed successfully.',
        type: 'payment_successful',
        data: { amount: 500, paymentId: 'pay_sample' },
        isRead: true
      },
      {
        recipient: userId,
        recipientRole: 'user',
        title: '📋 Medical Report Ready',
        message: 'Your pet\'s medical report is now available for download.',
        type: 'new_report_available',
        data: { reportId: 'report_sample' },
        isRead: false
      },
      {
        recipient: userId,
        recipientRole: 'user',
        title: '🔔 New Feature Available',
        message: 'Video consultations are now available! Book your virtual appointment today.',
        type: 'system_announcement',
        data: { feature: 'video_consultation' },
        isRead: false
      }
    ];

    await Notification.insertMany(testNotifications);

    console.log('✅ Test notifications created:', testNotifications.length);

    res.json({
      success: true,
      message: 'Test notifications created successfully',
      count: testNotifications.length
    });

  } catch (error) {
    console.error('❌ Error occurred:', error);
    res.status(500).json({ error: 'Failed to create test notifications' });
  }
});

// @route   POST /api/notifications/send-announcement
// @desc    Send announcement notification (Admin only)
// @access  Private (Admin)
router.post('/send-announcement', auth, async (req, res) => {
  try {
    const { title, message, recipientRole, priority = 'medium', channels } = req.body;
    const senderId = req.user;
    
    // ✅ Handle system admin (who doesn't exist in User collection)
    let sender;
    if (senderId === 'admin' && req.userRole === 'admin') {
      // System admin case
      sender = {
        _id: 'admin',
        name: process.env.ADMIN_NAME || 'VetCare Administrator',
        email: process.env.ADMIN_EMAIL || 'admin@vetcare.com',
        role: 'admin'
      };
      console.log('✅ System admin authentication verified');
    } else {
      // Regular user case - check in database
      sender = await User.findById(senderId);
      
      if (!sender) {
        console.log('❌ User not found for ID:', senderId);
        return res.status(403).json({ error: 'User not found' });
      }
    }
    
    console.log('✅ Sender found:', sender.name, 'Email:', sender.email, 'Role:', sender.role);
    
    if (sender.role !== 'admin') {
      console.log('❌ Access denied - not admin. Role:', sender.role);
      return res.status(403).json({ error: 'Only admins can send announcements' });
    }

    console.log('✅ Admin verification successful');

    if (!title || !message || !recipientRole) {
      return res.status(400).json({ error: 'Title, message, and recipient role are required' });
    }

    // Get recipients based on role
    let recipients;
    if (recipientRole === 'all') {
      // Send to all non-admin users (farmers, users, doctors, etc.)
      recipients = await User.find({ role: { $ne: 'admin' } }, '_id role');
    } else {
      // Send to specific role
      recipients = await User.find({ role: recipientRole }, '_id');
    }
    
    if (recipients.length === 0) {
      return res.status(404).json({ error: `No users found with role: ${recipientRole}` });
    }
    // Create notifications for all recipients
    const notifications = recipients.map(user => ({
      recipient: user._id,
      recipientRole: recipientRole === 'all' ? 'all' : recipientRole,
      type: 'system_announcement',
      title: title,
      message: message,
      priority: priority,
      channels: channels || { push: true, email: false, sms: false, inApp: true },
      data: {
        sender: senderId,
        senderName: sender.name,
        announcementType: 'admin_broadcast'
      }
    }));

    const created = await Notification.insertMany(notifications);

    // Send push notifications if enabled
    // Here you could integrate with the notification service to send real push notifications

    res.json({
      success: true,
      message: `Announcement sent to ${created.length} users`,
      recipientCount: created.length,
      recipients: recipientRole
    });

  } catch (error) {
    console.error('❌ Error occurred:', error);
    res.status(500).json({ error: 'Failed to send announcement' });
  }
});

// @route   POST /api/notifications/send-to-user
// @desc    Send notification to specific user (Doctor/Admin)
// @access  Private
router.post('/send-to-user', auth, async (req, res) => {
  try {
    const { recipientId, title, message, type = 'system_announcement', priority = 'medium' } = req.body;
    const senderId = req.user;

    if (!recipientId || !title || !message) {
      return res.status(400).json({ error: 'Recipient ID, title, and message are required' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Get sender info
    const sender = await User.findById(senderId);

    const notification = new Notification({
      recipient: recipientId,
      recipientRole: recipient.role,
      type: type,
      title: title,
      message: message,
      priority: priority,
      data: {
        sender: senderId,
        senderName: sender.name,
        senderRole: sender.role
      }
    });

    await notification.save();

    res.json({
      success: true,
      message: 'Notification sent successfully',
      notification: {
        id: notification._id,
        title: notification.title,
        recipient: recipient.name
      }
    });

  } catch (error) {
    console.error('❌ Error occurred:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

module.exports = router;