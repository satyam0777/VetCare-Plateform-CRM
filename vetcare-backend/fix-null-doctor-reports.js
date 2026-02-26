// const mongoose = require('mongoose');
// const Report = require('./models/Report');
// const Doctor = require('./models/Doctor');

// require('dotenv').config();

// async function fixNullDoctorReports() {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vetcare');
//     console.log('📡 Connected to MongoDB');

//     // Find an approved doctor to assign to null doctor reports
//     const defaultDoctor = await Doctor.findOne({ status: 'approved' });
//     if (!defaultDoctor) {
//       console.log('❌ No approved doctors found - cannot fix reports');
//       return;
//     }
    
//     console.log(`🏥 Using default doctor: ${defaultDoctor.name} (${defaultDoctor._id})`);

//     // Find all reports with null doctors
//     const reportsWithNullDoctors = await Report.find({ 
//       $or: [
//         { doctor: null },
//         { doctor: { $exists: false } }
//       ]
//     });
    
//     console.log(`📊 Found ${reportsWithNullDoctors.length} reports with null doctors`);
    
//     if (reportsWithNullDoctors.length > 0) {
//       // Update all reports with null doctors
//       const result = await Report.updateMany(
//         { 
//           $or: [
//             { doctor: null },
//             { doctor: { $exists: false } }
//           ]
//         },
//         { 
//           $set: { doctor: defaultDoctor._id }
//         }
//       );
      
//       console.log(`✅ Fixed ${result.modifiedCount} reports`);
//     }
    
//     mongoose.connection.close();
//     console.log('🔧 Report fixing completed');
//   } catch (error) {
//     console.error('❌ Error fixing reports:', error);
//   }
// }

// fixNullDoctorReports(); 
