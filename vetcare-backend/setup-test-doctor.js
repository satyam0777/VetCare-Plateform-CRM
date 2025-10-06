// const mongoose = require('mongoose');
// require('dotenv').config();
// const Doctor = require('./models/Doctor');

// async function setupTestDoctor() {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log('Connected to MongoDB');
    
//     // Find any doctor
//     let doctor = await Doctor.findOne();
    
//     if (!doctor) {
//       console.log('No doctors found. Creating a test doctor...');
      
//       // Create a test doctor
//       doctor = new Doctor({
//         name: 'Dr. Test Veterinarian',
//         email: 'testvet@vetcare.com',
//         mobile: '+91-9876543210',
//         specialization: 'General Practice',
//         education: 'BVSc & AH, MVSc',
//         experience: 5,
//         licenseNumber: 'VET12345',
//         verificationStatus: 'approved',
//         isAvailable: true,
//         consultationFee: 300,
//         bankDetails: {
//           accountNumber: '1234567890',
//           ifscCode: 'HDFC0001234',
//           bankName: 'HDFC Bank',
//           accountHolderName: 'Dr. Test Veterinarian',
//           verified: true
//         },
//         earnings: {
//           totalEarnings: 0,
//           pendingPayouts: 0,
//           completedPayouts: 0,
//           payoutHistory: []
//         }
//       });
      
//       await doctor.save();
//       console.log('✅ Created test doctor:', doctor.name);
//     } else {
//       console.log('Found existing doctor:', doctor.name);
      
//       // Approve existing doctor
//       doctor.verificationStatus = 'approved';
//       doctor.isAvailable = true;
      
//       // Add missing required fields
//       if (!doctor.mobile) {
//         doctor.mobile = '+91-9876543210';
//       }
      
//       // Ensure bank details exist
//       if (!doctor.bankDetails) {
//         doctor.bankDetails = {
//           accountNumber: '1234567890',
//           ifscCode: 'HDFC0001234',
//           bankName: 'HDFC Bank',
//           accountHolderName: doctor.name,
//           verified: true
//         };
//       }
      
//       // Ensure earnings structure exists
//       if (!doctor.earnings) {
//         doctor.earnings = {
//           totalEarnings: 0,
//           pendingPayouts: 0,
//           completedPayouts: 0,
//           payoutHistory: []
//         };
//       }
      
//       await doctor.save();
//       console.log('✅ Updated existing doctor:', doctor.name);
//     }
    
//     console.log('Doctor details:', {
//       name: doctor.name,
//       email: doctor.email,
//       specialization: doctor.specialization,
//       verificationStatus: doctor.verificationStatus,
//       consultationFee: doctor.consultationFee,
//       hasBankDetails: !!doctor.bankDetails,
//       hasEarnings: !!doctor.earnings
//     });
    
//     await mongoose.connection.close();
//     process.exit(0);
//   } catch (error) {
//     console.error('Error:', error);
//     process.exit(1);
//   }
// }

// setupTestDoctor();