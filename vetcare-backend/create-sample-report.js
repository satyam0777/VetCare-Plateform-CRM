// require('dotenv').config();
// const mongoose = require('mongoose');
// const Report = require('./models/Report');
// const Animal = require('./models/Animal');
// const User = require('./models/User');
// const Doctor = require('./models/Doctor');

// async function createSampleReport() {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log('✅ Connected to MongoDB');

//     // Get the current logged-in user ID from the logs
//     const currentUserId = '68da5f8bfa6a51a7b8932daa'; // From the backend logs
    
//     // Find the user
//     const user = await User.findById(currentUserId);
//     if (!user) {
//       console.log('❌ User not found');
//       return;
//     }
//     console.log(`📋 Found user: ${user.name} (${user._id})`);

//     // Find any doctor
//     const doctor = await Doctor.findOne({ status: 'active' });
//     if (!doctor) {
//       console.log('❌ No active doctor found');
//       return;
//     }
//     console.log(`📋 Found doctor: ${doctor.name} (${doctor._id})`);

//     // Create a sample animal
//     const animal = new Animal({
//       name: 'Buddy',
//       type: 'other',
//       breed: 'Golden Retriever',
//       age: 3,
//       gender: 'male',
//       owner: user._id,
//       healthStatus: 'healthy'
//     });
//     await animal.save();
//     console.log(`✅ Created animal: ${animal.name} (${animal._id})`);

//     // Create a sample report
//     const report = new Report({
//       title: 'Routine Health Checkup - Buddy',
//       animal: animal._id,
//       farmer: user._id,
//       doctor: doctor._id,
//       reportType: 'consultation',
//       diagnosis: 'Healthy pet with good vitals',
//       symptoms: ['Regular behavior', 'Good appetite'],
//       treatment: 'Routine examination completed',
//       recommendations: 'Continue regular exercise and balanced diet',
//       prescriptions: [
//         {
//           medicineName: 'Multivitamin supplement',
//           dosage: '1 tablet',
//           frequency: 'Once daily',
//           duration: '30 days',
//           instructions: 'Give with food'
//         }
//       ],
//       cost: {
//         consultationFee: 500,
//         medicinesCost: 200,
//         total: 700
//       },
//       status: 'completed',
//       doctorNotes: 'Pet is in excellent health. Continue current care routine.'
//     });

//     await report.save();
//     console.log(`✅ Created sample report: ${report.title} (${report._id})`);

//     console.log('\n🎉 Sample report created successfully!');
//     console.log(`📋 Summary:`);
//     console.log(`   - User ID: ${user._id}`);
//     console.log(`   - Doctor ID: ${doctor._id}`);
//     console.log(`   - Animal ID: ${animal._id}`);
//     console.log(`   - Report ID: ${report._id}`);

//   } catch (error) {
//     console.error('❌ Error creating sample report:', error);
//   } finally {
//     await mongoose.disconnect();
//     console.log('✅ Disconnected from MongoDB');
//   }
// }

// createSampleReport();