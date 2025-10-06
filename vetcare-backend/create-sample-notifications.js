// const mongoose = require('mongoose');
// const Notification = require('./models/Notification');

// // Sample user ID (replace with actual user ID from your database)
// const sampleUserId = '68da5f8bfa6a51a7b8932daa'; // Replace with actual user ID

// const sampleNotifications = [
//   {
//     recipient: sampleUserId,
//     recipientRole: 'farmer',
//     type: 'appointment_confirmed',
//     title: '✅ Appointment Confirmed',
//     message: 'Your appointment with Dr. Smith for Fluffy is confirmed for today at 2:30 PM',
//     data: { appointmentId: '507f1f77bcf86cd799439011', doctorName: 'Dr. Smith', petName: 'Fluffy' },
//     priority: 'high',
//     isRead: false,
//     createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
//   },
//   {
//     recipient: sampleUserId,
//     recipientRole: 'farmer',
//     type: 'payment_successful',
//     title: '💳 Payment Successful',
//     message: 'Payment of ₹500 for consultation has been processed successfully',
//     data: { amount: 500, paymentId: 'pay_123456' },
//     priority: 'medium',
//     isRead: false,
//     createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
//   },
//   {
//     recipient: sampleUserId,
//     recipientRole: 'farmer',
//     type: 'new_report_available',
//     title: '📋 Medical Report Ready',
//     message: 'Your pet\'s medical report is ready for download. Complete payment to access it.',
//     data: { reportId: 'rep_789', petName: 'Fluffy' },
//     priority: 'high',
//     isRead: false,
//     createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
//   },
//   {
//     recipient: sampleUserId,
//     recipientRole: 'farmer',
//     type: 'appointment_reminder',
//     title: '🔔 Appointment Reminder',
//     message: 'Reminder: Your appointment with Dr. Johnson is in 1 hour',
//     data: { appointmentId: '507f1f77bcf86cd799439012', doctorName: 'Dr. Johnson' },
//     priority: 'medium',
//     isRead: true,
//     createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
//   },
//   {
//     recipient: sampleUserId,
//     recipientRole: 'farmer',
//     type: 'doctor_online',
//     title: '👨‍⚕️ Video Call Ready',
//     message: 'Dr. Smith is ready for your video consultation. Join now!',
//     data: { appointmentId: '507f1f77bcf86cd799439013', doctorName: 'Dr. Smith' },
//     priority: 'urgent',
//     isRead: true,
//     createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
//   },
//   {
//     recipient: sampleUserId,
//     recipientRole: 'farmer',
//     type: 'system_announcement',
//     title: '🎉 Welcome to VetCare Premium',
//     message: 'Thank you for upgrading! You now have access to 24/7 consultations and priority support.',
//     data: { plan: 'premium' },
//     priority: 'low',
//     isRead: true,
//     createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
//   }
// ];

// async function createSampleNotifications() {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vetcare');
//     console.log('📦 Connected to MongoDB');

//     // Clear existing notifications for this user
//     await Notification.deleteMany({ recipient: sampleUserId });
//     console.log('🗑️  Cleared existing notifications');

//     // Insert sample notifications
//     const created = await Notification.insertMany(sampleNotifications);
//     console.log(`✅ Created ${created.length} sample notifications`);

//     console.log('\n📱 Sample notifications created:');
//     created.forEach((notif, index) => {
//       console.log(`${index + 1}. ${notif.title}`);
//     });

//     process.exit(0);
//   } catch (error) {
//     console.error('❌ Error creating sample notifications:', error);
//     process.exit(1);
//   }
// }

// createSampleNotifications();