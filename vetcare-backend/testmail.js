const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'vetcare0777@gmail.com',
    pass: 'ngog zxpf otfe exvl'
  }
});
transporter.sendMail({
  from: 'VetCare <vetcare0777@gmail.com>',
  to: 'satyamprajapati777@gmail.com',
  subject: 'Test Email',
  text: 'This is a test email from nodemailer'
}, (err, info) => {
  if (err) return console.error('Error:', err);
  console.log('Success:', info);
});