// // Cleanup script to fix any corrupted reports in the database
// const mongoose = require('mongoose');
// require('dotenv').config();

// const Report = require('./models/Report');

// async function cleanupReports() {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log('✅ Connected to MongoDB');

//     // Find all reports
//     const reports = await Report.find({});
//     console.log(`🔍 Found ${reports.length} reports in database`);

//     let deletedCount = 0;
//     let validCount = 0;

//     for (const report of reports) {
//       try {
//         // Check if farmer field is valid
//         if (!report.farmer || !mongoose.Types.ObjectId.isValid(report.farmer)) {
//           console.log(`❌ Deleting invalid report: ${report._id} - Invalid farmer ID: ${report.farmer}`);
//           await Report.findByIdAndDelete(report._id);
//           deletedCount++;
//         } else {
//           validCount++;
//         }
//       } catch (error) {
//         console.log(`❌ Error processing report ${report._id}:`, error.message);
//         await Report.findByIdAndDelete(report._id);
//         deletedCount++;
//       }
//     }

//     console.log(`✅ Cleanup completed:`);
//     console.log(`   - Valid reports: ${validCount}`);
//     console.log(`   - Deleted invalid reports: ${deletedCount}`);

//   } catch (error) {
//     console.error('❌ Cleanup error:', error);
//   } finally {
//     await mongoose.disconnect();
//     console.log('✅ Disconnected from MongoDB');
//   }
// }

// // Run the cleanup
// cleanupReports();