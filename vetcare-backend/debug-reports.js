// const mongoose = require('mongoose');
// const Report = require('./models/Report');
// const Doctor = require('./models/Doctor');
// const User = require('./models/User');
// const Animal = require('./models/Animal');

// require('dotenv').config();

// async function debugReports() {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vetcare');
//     console.log('📡 Connected to MongoDB');

//     // Get the problematic report
//     const reportId = '68dc1863b6186ed181a5bf18';
//     const report = await Report.findById(reportId);
    
//     console.log('🔍 Raw Report Data:');
//     console.log('- Report ID:', report._id);
//     console.log('- Doctor ID (raw):', report.doctor);
//     console.log('- Farmer ID (raw):', report.farmer);
//     console.log('- Animal ID (raw):', report.animal);
    
//     // Check if the doctor exists
//     if (report.doctor) {
//       const doctor = await Doctor.findById(report.doctor);
//       console.log('👨‍⚕️ Doctor exists:', !!doctor);
//       if (doctor) {
//         console.log('- Doctor Name:', doctor.name);
//         console.log('- Doctor Status:', doctor.status);
//       }
//     } else {
//       console.log('👨‍⚕️ Doctor ID is null/undefined');
//     }
    
//     // Check if farmer exists
//     if (report.farmer) {
//       const farmer = await User.findById(report.farmer);
//       console.log('👤 Farmer exists:', !!farmer);
//       if (farmer) {
//         console.log('- Farmer Name:', farmer.name);
//       }
//     }
    
//     // Check if animal exists
//     if (report.animal) {
//       const animal = await Animal.findById(report.animal);
//       console.log('🐕 Animal exists:', !!animal);
//       if (animal) {
//         console.log('- Animal Name:', animal.name);
//       }
//     }
    
//     // Get all reports with null doctors
//     const reportsWithNullDoctors = await Report.find({ 
//       $or: [
//         { doctor: null },
//         { doctor: { $exists: false } }
//       ]
//     });
    
//     console.log(`\n📊 Found ${reportsWithNullDoctors.length} reports with null doctors`);
    
//     mongoose.connection.close();
//   } catch (error) {
//     console.error('❌ Error:', error);
//   }
// }

// debugReports();