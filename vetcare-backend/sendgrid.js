// SendGrid email utility for VetCare
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail({ to, subject, text, html }) {
  try {
    const msg = {
      to,
      from: process.env.EMAIL_FROM || 'vetcare0777@gmail.com',
      subject,
      text: text || undefined,
      html: html || undefined,
    };
    const result = await sgMail.send(msg);
    console.log('✅ [SendGrid] Email sent:', result[0]?.statusCode, '| To:', to, '| Subject:', subject);
    return { success: true, statusCode: result[0]?.statusCode };
  } catch (error) {
    console.error('❌ [SendGrid] Email send failed:', error.message, '| To:', to, '| Subject:', subject);
    return { success: false, message: error.message };
  }
}

module.exports = { sendEmail };
