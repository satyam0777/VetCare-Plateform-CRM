// const mongoose = require('mongoose');
// const dotenv = require('dotenv');
// dotenv.config();

// // Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(() => {
//   console.log('✅ Connected to MongoDB');
// }).catch((error) => {
//   console.error('❌ MongoDB connection failed:', error);
//   process.exit(1);
// });

// const User = require('./models/User');

// async function updateAdminUser() {
//   try {
//     // Check if admin already exists
//     let admin = await User.findOne({ email: 'admin@vetcare.com' });
    
//     if (!admin) {
//       // Create new admin
//       admin = new User({
//         name: 'VetCare Admin',
//         email: 'admin@vetcare.com',
//         password: 'SecureAdmin@123', // Will be hashed by pre-save middleware
//         role: 'admin',
//         isEmailVerified: true,
//         phone: '+91-9999999999',
//         permissions: [
//           'manage_doctors',
//           'manage_users', 
//           'manage_appointments',
//           'view_analytics',
//           'manage_payments',
//           'verify_doctors',
//           'process_payouts',
//           'view_earnings',
//           'manage_reports'
//         ]
//       });
      
//       await admin.save();
//       console.log('✅ Admin user created successfully');
//     } else {
//       // Update existing admin with new permissions
//       admin.permissions = [
//         'manage_doctors',
//         'manage_users', 
//         'manage_appointments',
//         'view_analytics',
//         'manage_payments',
//         'verify_doctors',
//         'process_payouts',
//         'view_earnings',
//         'manage_reports'
//       ];
//       await admin.save();
//       console.log('✅ Admin user updated with new permissions');
//     }
    
//     console.log('Admin Details:');
//     console.log('Email:', admin.email);
//     console.log('Role:', admin.role);
//     console.log('Permissions:', admin.permissions);
    
//     process.exit(0);
//   } catch (error) {
//     console.error('❌ Error updating admin:', error);
//     process.exit(1);
//   }
// }

// updateAdminUser();