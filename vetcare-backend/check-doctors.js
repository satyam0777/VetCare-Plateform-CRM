// const mongoose = require('mongoose');
// const Doctor = require('./models/Doctor');

// require('dotenv').config();

// async function checkDoctors() {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vetcare');
//     console.log('📡 Connected to MongoDB');

//     const allDoctors = await Doctor.find({});
//     console.log(`👨‍⚕️ Total doctors in database: ${allDoctors.length}`);
    
//     allDoctors.forEach(doctor => {
//       console.log(`- ${doctor.name} (${doctor._id}) - Status: ${doctor.status}`);
//     });
    
//     // Check if there are any doctors we can approve
//     const pendingDoctors = await Doctor.find({ status: 'pending' });
//     console.log(`⏳ Pending doctors: ${pendingDoctors.length}`);
    
//     mongoose.connection.close();
//   } catch (error) {
//     console.error('❌ Error:', error);
//   }
// }

// checkDoctors();