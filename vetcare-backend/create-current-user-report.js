// const mongoose = require('mongoose');
// require('dotenv').config();

// const User = require('./models/User');
// const Doctor = require('./models/Doctor');
// const Animal = require('./models/Animal');
// const Report = require('./models/Report');
// const Appointment = require('./models/Appointment');

// async function createCurrentUserReport() {
//   try {
//     console.log('🔗 Connecting to MongoDB...');
//     await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
//     console.log('✅ Connected to MongoDB');

//     // Use the current logged-in user ID from the logs
//     const currentUserId = '68da5f8bfa6a51a7b8932daa';
    
//     // Find the current user
//     const user = await User.findById(currentUserId);
//     if (!user) {
//       console.log('❌ Current user not found');
//       return;
//     }
//     console.log(`📋 Found current user: ${user.name} (${user._id})`);

//     // Find any approved doctor
//     const doctor = await Doctor.findOne({ status: 'approved' });
//     if (!doctor) {
//       console.log('❌ No approved doctors found');
//       return;
//     }
//     console.log(`📋 Found doctor: ${doctor.name} (${doctor._id})`);

//     // Create a test appointment for current user
//     const testAppointment = new Appointment({
//       user: user._id,
//       doctor: doctor._id,
//       date: new Date(),
//       time: '10:00 AM',
//       petName: 'Buddy (Current User Pet)',
//       reason: 'Regular checkup for current user',
//       consultation: {
//         symptoms: 'Regular health checkup',
//         diagnosis: 'Healthy pet',
//         examination: 'Physical examination completed',
//         recommendations: 'Continue regular care'
//       },
//       prescription: {
//         medicines: [{
//           name: 'Multivitamins',
//           dosage: '1 tablet daily',
//           frequency: 'Once daily',
//           duration: '30 days',
//           instructions: 'Give with food'
//         }]
//       },
//       payment: {
//         consultationFee: 500,
//         medicineCharges: 200,
//         totalAmount: 700
//       },
//       status: 'completed'
//     });

//     await testAppointment.save();
//     console.log(`✅ Created test appointment with ID: ${testAppointment._id}`);

//     // Create animal record
//     const animal = new Animal({
//       name: 'Buddy (Current User Pet)',
//       type: 'dog',
//       breed: 'Golden Retriever',
//       age: 2,
//       gender: 'male',
//       owner: user._id,
//       healthStatus: 'healthy'
//     });

//     await animal.save();
//     console.log(`✅ Created animal record with ID: ${animal._id}`);

//     // Create medical report for current user
//     const report = new Report({
//       title: `Consultation Report - ${testAppointment.petName}`,
//       animal: animal._id,
//       farmer: user._id, // This is the key field - using current user
//       doctor: doctor._id,
//       appointment: testAppointment._id,
//       reportType: 'consultation',
//       diagnosis: testAppointment.consultation.diagnosis,
//       symptoms: [testAppointment.consultation.symptoms],
//       treatment: testAppointment.consultation.examination,
//       recommendations: testAppointment.consultation.recommendations,
//       prescriptions: testAppointment.prescription.medicines.map(med => ({
//         medicineName: med.name,
//         dosage: med.dosage,
//         frequency: med.frequency,
//         duration: med.duration,
//         instructions: med.instructions || 'Take as prescribed'
//       })),
//       cost: {
//         consultationFee: testAppointment.payment.consultationFee,
//         medicinesCost: testAppointment.payment.medicineCharges,
//         total: testAppointment.payment.totalAmount
//       },
//       status: 'completed',
//       doctorNotes: 'Test appointment for current user - everything normal'
//     });

//     await report.save();
//     console.log(`✅ Created medical report with ID: ${report._id}`);

//     console.log(`\n🎉 Test report creation for current user successful!`);
//     console.log(`📋 Summary:`);
//     console.log(`   - Current User ID: ${user._id}`);
//     console.log(`   - Appointment ID: ${testAppointment._id}`);
//     console.log(`   - Animal ID: ${animal._id}`);
//     console.log(`   - Report ID: ${report._id}`);
//     console.log(`   - Doctor ID: ${doctor._id}`);

//     console.log(`\n💡 Now the current user should see this report in their dashboard!`);

//   } catch (error) {
//     console.error('❌ Test error:', error);
//   } finally {
//     await mongoose.disconnect();
//     console.log('✅ Disconnected from MongoDB');
//   }
// }

// // Run the test
// createCurrentUserReport();