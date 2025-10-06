// require('dotenv').config();
// const bankingService = require('./services/bankingService');

// async function testBankTransfer() {
//   console.log('🧪 Testing VetCare Banking System\n');

//   // Test doctor bank details (Dr. OP Prajapati)
//   const doctorBankDetails = {
//     accountHolderName: 'Dr. OP Prajapati',
//     accountNumber: '1234567890',
//     ifscCode: 'HDFC0001234',
//     bankName: 'HDFC Bank',
//     verified: true
//   };

//   // Test transfer amount (₹246 = 82% of ₹300)
//   const amount = 246;
//   const reference = 'TEST_CONSULTATION_PAYMENT';

//   try {
//     console.log('💰 Initiating test transfer...');
//     console.log(`Amount: ₹${amount}`);
//     console.log(`Doctor: ${doctorBankDetails.accountHolderName}`);
//     console.log(`Account: ${doctorBankDetails.accountNumber}`);
//     console.log(`IFSC: ${doctorBankDetails.ifscCode}`);
//     console.log('');

//     const result = await bankingService.transferToDoctor(doctorBankDetails, amount, reference);

//     if (result.success) {
//       console.log('✅ Transfer Successful!');
//       console.log(`Transaction ID: ${result.transactionId}`);
//       console.log(`Bank Reference: ${result.bankReference}`);
//       console.log(`Transfer Date: ${result.transferDate}`);
//       console.log(`From VetCare Account: ...${result.vetcareAccount.accountNumber}`);
//       console.log(`To Doctor Account: ...${result.doctorAccount.accountNumber}`);
//     } else {
//       console.log('❌ Transfer Failed!');
//       console.log(`Error: ${result.error}`);
//     }

//     console.log('\n🏦 Platform Balance:');
//     const balance = await bankingService.getPlatformBalance();
//     console.log(`Available: ₹${balance.balance}`);
//     console.log(`Account: ...${balance.accountNumber}`);

//   } catch (error) {
//     console.error('❌ Test failed:', error);
//   }
// }

// testBankTransfer();