// // Test script to create a sample appointment completion and report
// const mongoose = require('mongoose');
// require('dotenv').config();

// // Import models
// const Appointment = require('./models/Appointment');
// const Report = require('./models/Report');
// const Animal = require('./models/Animal');
// const User = require('./models/User');
// const Doctor = require('./models/Doctor');

// async function createTestAppointment() {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log('✅ Connected to MongoDB');

//     // Find a user and doctor to create test appointment
//     const user = await User.findOne();
//     const doctor = await Doctor.findOne();

//     if (!user || !doctor) {
//       console.log('❌ Need at least one user and one doctor in database');
//       return;
//     }

//     console.log(`📋 Found user: ${user.name} (${user._id})`);
//     console.log(`📋 Found doctor: ${doctor.name} (${doctor._id})`);

//     // Create a test appointment
//     const testAppointment = new Appointment({
//       user: user._id,
//       doctor: doctor._id,
//       petName: 'Test Pet',
//       petAge: 3,
//       petBreed: 'Golden Retriever',
//       date: new Date(),
//       time: '10:00 AM',
//       reason: 'Regular checkup',
//       status: 'confirmed',
//       consultation: {
//         diagnosis: 'Healthy pet - routine checkup completed',
//         symptoms: 'No symptoms observed',
//         examination: 'Complete physical examination performed',
//         recommendations: 'Continue regular care, next checkup in 6 months'
//       },
//       prescription: {
//         medicines: [
//           {
//             name: 'Vitamin supplements',  // This should match Appointment model schema
//             dosage: '1 tablet daily',
//             frequency: 'Once daily',
//             duration: '30 days',
//             instructions: 'Give with food',
//             cost: 50
//           }
//         ]
//       },
//       payment: {
//         consultationFee: 100,
//         medicineCharges: 50,
//         totalAmount: 150
//       }
//     });

//     await testAppointment.save();
//     console.log(`✅ Created test appointment with ID: ${testAppointment._id}`);

//     // Now complete the appointment and create report
//     testAppointment.status = 'completed';
//     testAppointment.completedAt = new Date();
//     testAppointment.reportGenerated = true;
//     testAppointment.reportGeneratedAt = new Date();
//     await testAppointment.save();

//     // Create animal record
//     const animal = new Animal({
//       name: testAppointment.petName,
//       type: 'other',
//       age: testAppointment.petAge || 3,
//       gender: 'male',
//       owner: user._id,
//       healthStatus: 'healthy'
//     });
//     await animal.save();
//     console.log(`✅ Created animal record with ID: ${animal._id}`);

//     // Create medical report
//     console.log('🔍 Debug - prescription medicines:', JSON.stringify(testAppointment.prescription.medicines, null, 2));
    
//     const report = new Report({
//       title: `Consultation Report - ${testAppointment.petName}`,
//       animal: animal._id,
//       farmer: user._id,
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
//       doctorNotes: 'Test appointment completion - everything normal'
//     });

//     await report.save();
//     console.log(`✅ Created medical report with ID: ${report._id}`);

//     console.log(`\n🎉 Test appointment completion successful!`);
//     console.log(`📋 Summary:`);
//     console.log(`   - Appointment ID: ${testAppointment._id}`);
//     console.log(`   - Animal ID: ${animal._id}`);
//     console.log(`   - Report ID: ${report._id}`);
//     console.log(`   - User ID: ${user._id}`);
//     console.log(`   - Doctor ID: ${doctor._id}`);

//   } catch (error) {
//     console.error('❌ Test error:', error);
//   } finally {
//     await mongoose.disconnect();
//     console.log('✅ Disconnected from MongoDB');
//   }
// }

// // Run the test
// createTestAppointment();