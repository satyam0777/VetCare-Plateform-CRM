// /**
//  * 🔍 CLOUDINARY DASHBOARD GUIDE
//  * 
//  * When you login to cloudinary.com, you'll see:
//  * 
//  * ┌─────────────────────────────────────────────────────────┐
//  * │  🌤️ Cloudinary Dashboard                                │
//  * ├─────────────────────────────────────────────────────────┤
//  * │                                                         │
//  * │  📊 Product Environment Credentials                     │
//  * │  ┌─────────────────────────────────────────────────┐   │
//  * │  │  Cloud Name: your-cloud-name                    │   │
//  * │  │  API Key: 123456789012345                       │   │
//  * │  │  API Secret: ••••••••••••••••••••  [Reveal]     │   │
//  * │  └─────────────────────────────────────────────────┘   │
//  * │                                                         │
//  * │  📈 Usage Statistics                                    │
//  * │  Storage: 0 / 25 GB                                     │
//  * │  Bandwidth: 0 / 25 GB                                   │
//  * │  Credits: 25 / 25                                       │
//  * │                                                         │
//  * └─────────────────────────────────────────────────────────┘
//  */

// // STEP 1: Copy these 3 values from your dashboard
// const CLOUDINARY_CREDENTIALS = {
//   CLOUD_NAME: "your-cloud-name",     // ← Copy this
//   API_KEY: "123456789012345",        // ← Copy this  
//   API_SECRET: "your-secret-key"      // ← Click "Reveal" then copy
// };

// // STEP 2: Add to your .env file exactly like this:
// /*
// STORAGE_TYPE=cloudinary
// CLOUDINARY_CLOUD_NAME=your-cloud-name
// CLOUDINARY_API_KEY=123456789012345
// CLOUDINARY_API_SECRET=your-secret-key
// */

// // STEP 3: Test configuration
// const cloudinary = require('cloudinary').v2;

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// // STEP 4: Quick test function
// async function testCloudinaryConnection() {
//   try {
//     const result = await cloudinary.api.ping();
//     console.log('✅ Cloudinary connected successfully!');
//     console.log('📊 Account details:', result);
//     return true;
//   } catch (error) {
//     console.log('❌ Cloudinary connection failed:');
//     console.log('🔍 Error details:', error.message);
    
//     // Common error solutions
//     if (error.message.includes('Invalid API credentials')) {
//       console.log('\n💡 Solutions:');
//       console.log('   1. Double-check your Cloud Name, API Key, and API Secret');
//       console.log('   2. Make sure API Secret is revealed and copied correctly');
//       console.log('   3. Check for extra spaces in your .env file');
//     }
    
//     return false;
//   }
// }

// // STEP 5: Expected folder structure after uploads
// /*
// Your Cloudinary Media Library will look like:

// 📁 vetcare-documents/
//   ├── 📄 license_1234567890_doctor_license.pdf
//   ├── 🎓 degree_1234567891_medical_degree.jpg  
//   ├── 📸 photo_1234567892_profile_photo.jpg
//   ├── 🆔 idproof_1234567893_aadhar_card.pdf
//   └── 🏥 clinic_1234567894_clinic_photo.jpg
// */

// module.exports = {
//   testCloudinaryConnection,
//   CLOUDINARY_CREDENTIALS
// };