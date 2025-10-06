// const bcrypt = require('bcryptjs');
// const User = require('./models/User');
// const connectDB = require('./config/db');

// /**
//  * Secure Admin Creation Script
//  * 
//  * This script creates admin users using environment variables
//  * for secure credential management.
//  * 
//  * Required Environment Variables:
//  * - ADMIN_EMAIL: Email for the admin user
//  * - ADMIN_PASSWORD: Strong password for the admin user
//  * - MONGODB_URI: Database connection string
//  */

// async function createSecureAdmin() {
//   try {
//     // Validate environment variables
//     if (!process.env.ADMIN_EMAIL) {
//       throw new Error('ADMIN_EMAIL environment variable is required');
//     }
    
//     if (!process.env.ADMIN_PASSWORD) {
//       throw new Error('ADMIN_PASSWORD environment variable is required');
//     }

//     // Validate password strength
//     const password = process.env.ADMIN_PASSWORD;
//     if (password.length < 8) {
//       throw new Error('Admin password must be at least 8 characters long');
//     }

//     if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
//       throw new Error('Admin password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
//     }

//     await connectDB();
    
//     // Check if admin already exists
//     const existingAdmin = await User.findOne({ 
//       email: process.env.ADMIN_EMAIL,
//       role: 'owner'
//     });
    
//     if (existingAdmin) {
//       console.log('⚠️  Admin user already exists');
//       console.log('📧 Email:', process.env.ADMIN_EMAIL);
//       return;
//     }

//     // Create secure admin
//     const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    
//     const adminUser = new User({
//       name: 'VetCare Administrator',
//       email: process.env.ADMIN_EMAIL,
//       password: hashedPassword,
//       role: 'owner',
//       isActive: true,
//       isEmailVerified: true,
//       security: {
//         accountLocked: false,
//         loginAttempts: 0,
//         lastPasswordChange: new Date(),
//         passwordHistory: [hashedPassword]
//       }
//     });

//     await adminUser.save();
    
//     console.log('✅ Secure admin user created successfully!');
//     console.log('📧 Email:', process.env.ADMIN_EMAIL);
//     console.log('🔐 Password: [SECURED - Set via environment variable]');
//     console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
//     console.log('   • Change the default password immediately after first login');
//     console.log('   • Enable two-factor authentication');
//     console.log('   • Monitor admin account activity regularly');
//     console.log('   • Never share admin credentials');
    
//   } catch (error) {
//     console.error('❌ Error creating secure admin:', error.message);
//     process.exit(1);
//   } finally {
//     process.exit(0);
//   }
// }

// // Run the secure admin creation
// createSecureAdmin();