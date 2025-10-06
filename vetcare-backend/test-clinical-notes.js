// const mongoose = require('mongoose');
// const Report = require('./models/Report');

// // Test clinical notes functionality
// async function testClinicalNotes() {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect('mongodb://localhost:27017/vetcare', {
//       useNewUrlParser: true,
//       useUnifiedTopology: true
//     });
//     console.log('📊 Connected to MongoDB');

//     // Find a test report
//     const reports = await Report.find().limit(3);
//     console.log(`📋 Found ${reports.length} reports`);
    
//     if (reports.length > 0) {
//       const testReport = reports[0];
//       console.log(`📝 Testing with report ID: ${testReport._id}`);
//       console.log(`📄 Report diagnosis: ${testReport.diagnosis}`);
//       console.log(`🐾 Animal: ${testReport.animal}`);
      
//       // Test clinical note structure
//       const testClinicalNote = {
//         outcome: 'successful',
//         animalBehavior: 'Test behavior response',
//         outcomeDetails: 'Test outcome details',
//         lessonsLearned: 'Test lessons learned',
//         preventionStrategy: 'Test prevention strategy',
//         complications: 'No complications'
//       };
      
//       // Update the report with clinical note
//       const updatedReport = await Report.findByIdAndUpdate(
//         testReport._id,
//         { 
//           $set: { 
//             clinicalNote: {
//               ...testClinicalNote,
//               addedAt: new Date(),
//               addedBy: 'test-doctor-id'
//             }
//           }
//         },
//         { new: true }
//       );
      
//       console.log('✅ Clinical note added successfully');
//       console.log('📋 Updated clinical note:', updatedReport.clinicalNote);
      
//       // Verify the update
//       const verifyReport = await Report.findById(testReport._id);
//       if (verifyReport.clinicalNote) {
//         console.log('✅ Clinical note verified in database');
//         console.log('📄 Outcome:', verifyReport.clinicalNote.outcome);
//         console.log('🐾 Behavior:', verifyReport.clinicalNote.animalBehavior);
//       } else {
//         console.log('❌ Clinical note not found in database');
//       }
//     } else {
//       console.log('❌ No reports found for testing');
//     }
    
//   } catch (error) {
//     console.error('❌ Test failed:', error);
//   } finally {
//     await mongoose.disconnect();
//     console.log('📊 Disconnected from MongoDB');
//   }
// }

// // Run the test
// testClinicalNotes();