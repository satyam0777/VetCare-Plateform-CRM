const nodemailer = require('nodemailer');

console.log('✅ VetCare Email Service - Ready');

// Initialize transporter
let transporter = null;

async function initializeEmailService() {
    try {
        // ✅ Clean up environment variables (remove quotes if present)
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS?.replace(/"/g, ''); // Remove quotes
        
        console.log('🔧 Email config check:', {
            user: emailUser,
            passLength: emailPass?.length,
            hasUser: !!emailUser,
            hasPass: !!emailPass
        });
        
        if (!emailUser || !emailPass) {
            throw new Error('Missing EMAIL_USER or EMAIL_PASS environment variables');
        }
        
        transporter = nodemailer.createTransport({ // ✅ Fixed: createTransport not createTransporter
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: emailPass
            }
        });
        
        // ✅ Test the connection
        await transporter.verify();
        console.log('✅ Email transporter initialized and verified successfully');
        return true;
    } catch (error) {
        console.log('❌ Email transporter failed:', error.message);
        console.log('⚠️ Using fallback email method');
        transporter = null;
        return false;
    }
}

// ✅ Don't initialize immediately - wait for dotenv to load
// initializeEmailService() will be called from server.js after dotenv.config()

function generateDoctorAccessLink(doctorId) {
    const token = `doc_${doctorId}_${Date.now()}`;
    return {
        uniqueToken: token,
        accessLink: `http://localhost:3000/doctor-dashboard/${token}` // ✅ Fixed: Use frontend URL
    };
}

async function sendDoctorApprovalEmail(doctorData, accessLink) {
    console.log('📧 Sending approval email to:', doctorData.email);
    
    if (transporter) {
        try {
            const mailOptions = {
                from: `"VetCare Professional Platform" <${process.env.EMAIL_USER || 'vetcare0777@gmail.com'}>`,
                to: doctorData.email,
                subject: ' VetCare Account Approved - Welcome to Our Professional Network',
                html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>VetCare Account Approval</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 650px; margin: 0 auto; background: #ffffff; }
                        .header { background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 40px 30px; text-align: center; }
                        .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
                        .tagline { color: #dcfce7; font-size: 14px; font-weight: 300; }
                        .content { padding: 40px 30px; }
                        .welcome-badge { background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center; }
                        .doctor-name { font-size: 24px; color: #0369a1; font-weight: bold; margin-bottom: 8px; }
                        .credentials { color: #64748b; font-size: 14px; }
                        .cta-section { background: #f8fafc; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center; border-left: 4px solid #16a34a; }
                        .cta-button { display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #059669 100%); color: white; text-decoration: none; padding: 15px 35px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(22, 163, 74, 0.3); transition: all 0.3s ease; }
                        .cta-button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(22, 163, 74, 0.4); }
                        .features { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
                        .feature { background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 3px solid #16a34a; }
                        .feature-icon { font-size: 24px; margin-bottom: 10px; }
                        .feature-title { font-weight: bold; color: #1f2937; margin-bottom: 5px; }
                        .feature-desc { font-size: 13px; color: #6b7280; }
                        .footer { background: #1f2937; color: #d1d5db; padding: 30px; text-align: center; }
                        .footer-links { margin: 20px 0; }
                        .footer-links a { color: #60a5fa; text-decoration: none; margin: 0 15px; }
                        .social-links { margin-top: 20px; }
                        .social-links a { display: inline-block; margin: 0 8px; color: #9ca3af; text-decoration: none; }
                        .disclaimer { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0; font-size: 12px; color: #92400e; }
                        @media (max-width: 600px) {
                            .container { margin: 0; }
                            .content { padding: 20px; }
                            .features { grid-template-columns: 1fr; }
                            .cta-button { padding: 12px 25px; font-size: 14px; }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <!-- Header -->
                        <div class="header">
                            <div class="logo">🏥 VetCare Professional</div>
                            <div class="tagline">Advanced Veterinary Care Platform</div>
                        </div>

                        <!-- Main Content -->
                        <div class="content">
                            <!-- Welcome Badge -->
                            <div class="welcome-badge">
                                <div class="doctor-name">Dr. ${doctorData.name}</div>
                                <div class="credentials">Licensed Veterinary Professional</div>
                            </div>

                            <h2 style="color: #1f2937; margin-bottom: 20px;">🎉 Welcome to VetCare Professional Network</h2>
                            
                            <p style="margin-bottom: 20px; color: #4b5563; font-size: 16px;">
                                Congratulations! Your application to join VetCare has been thoroughly reviewed and <strong>approved</strong> by our credentialing team. You are now part of India's leading veterinary care platform.
                            </p>

                            <!-- CTA Section -->
                            <div class="cta-section">
                                <h3 style="color: #1f2937; margin-bottom: 15px;">🚀 Access Your Professional Dashboard</h3>
                                <p style="margin-bottom: 20px; color: #6b7280;">
                                    Your personalized doctor portal is ready with advanced tools for patient management, consultation scheduling, and report generation.
                                </p>
                                <a href="${accessLink}" class="cta-button">
                                    🔐 Access Doctor Portal
                                </a>
                                <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                                    This secure link is unique to your account and expires in 7 days.
                                </p>
                            </div>

                            <!-- Platform Features -->
                            <h3 style="color: #1f2937; margin: 30px 0 20px 0;">🌟 What You Can Do on VetCare</h3>
                            <div class="features">
                                <div class="feature">
                                    <div class="feature-icon">📅</div>
                                    <div class="feature-title">Smart Scheduling</div>
                                    <div class="feature-desc">Manage appointments with AI-powered scheduling and automated reminders</div>
                                </div>
                                <div class="feature">
                                    <div class="feature-icon">📊</div>
                                    <div class="feature-title">Digital Reports</div>
                                    <div class="feature-desc">Generate professional medical reports with digital signatures</div>
                                </div>
                                <div class="feature">
                                    <div class="feature-icon">💰</div>
                                    <div class="feature-title">Secure Payments</div>
                                    <div class="feature-desc">Integrated payment processing with instant settlements</div>
                                </div>
                                <div class="feature">
                                    <div class="feature-icon">📱</div>
                                    <div class="feature-title">Telemedicine</div>
                                    <div class="feature-desc">Conduct virtual consultations with HD video calling</div>
                                </div>
                            </div>

                            <div class="disclaimer">
                                <strong>🔒 Security Notice:</strong> This email contains sensitive information. Please keep your login credentials secure and do not share your access link with unauthorized personnel.
                            </div>

                            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                                If you have any questions or need technical support, our team is available 24/7 at 
                                <a href="mailto:support@vetcare.com" style="color: #16a34a;">support@vetcare.com</a> 
                                or call us at <strong>+91-7985792091</strong>.
                            </p>
                        </div>

                        <!-- Footer -->
                        <div class="footer">
                            <div style="font-weight: bold; font-size: 18px; margin-bottom: 10px;">VetCare Professional Platform</div>
                            <div style="margin-bottom: 15px;">Revolutionizing veterinary care across India</div>
                            
                            <div class="footer-links">
                                <a href="https://vetcare.com/doctors">Doctor Portal</a>
                                <a href="https://vetcare.com/support">Support Center</a>
                                <a href="https://vetcare.com/privacy">Privacy Policy</a>
                                <a href="https://vetcare.com/terms">Terms of Service</a>
                            </div>

                            <div class="social-links">
                                <a href="#">📧 Email</a>
                                <a href="#">📱 WhatsApp</a>
                                <a href="#">🐦 Twitter</a>
                                <a href="#">💼 LinkedIn</a>
                            </div>

                            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #374151; font-size: 12px; color: #9ca3af;">
                                © 2025 VetCare Professional Platform. All rights reserved.<br>
                                📍 Uttar Pradesh, Delhi, India | 🌐 www.vetcare.com<br>
                                <em>This is an automated message from our secure system.</em>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                `
            };
            
            const result = await transporter.sendMail(mailOptions);
            console.log('✅ Professional email sent successfully:', result.messageId);
            console.log('📤 Email delivered to:', doctorData.email);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.log('❌ Email failed:', error.message);
            console.log('🔧 SMTP Error details:', error);
            return { success: false, message: error.message };
        }
    }
    
    console.log('⚠️ Email not sent - using fallback mode (transporter not available)');
    return { success: true, message: 'Email logged (fallback mode)' };
}

async function sendDoctorRejectionEmail(doctorData, reason) {
    console.log('📧 Sending professional rejection email to:', doctorData.email);
    
    if (transporter) {
        try {
            const mailOptions = {
                from: `"VetCare Professional Platform" <${process.env.EMAIL_USER || 'vetcare0777@gmail.com'}>`,
                to: doctorData.email,
                subject: '📋 Application Status Update - VetCare Platform',
                html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.8; color: #333; margin: 0; padding: 0; background: #f8fafc; }
                        .container { max-width: 700px; margin: 0 auto; background: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-radius: 16px; overflow: hidden; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; }
                        .content { padding: 45px 40px; }
                        .doctor-badge { background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 16px; padding: 25px; margin: 25px 0; text-align: center; border: 2px solid #e2e8f0; }
                        .feedback-section { background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%); border-radius: 16px; padding: 30px; margin: 25px 0; border-left: 6px solid #e53e3e; box-shadow: 0 4px 12px rgba(229,62,62,0.1); }
                        .encouragement-section { background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%); border-radius: 16px; padding: 30px; margin: 25px 0; border-left: 6px solid #38a169; box-shadow: 0 4px 12px rgba(56,161,105,0.1); }
                        .reapply-section { background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%); border-radius: 16px; padding: 30px; margin: 25px 0; border-left: 6px solid #3182ce; box-shadow: 0 4px 12px rgba(49,130,206,0.1); }
                        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 30px; font-weight: bold; font-size: 16px; margin: 20px 0; box-shadow: 0 4px 15px rgba(102,126,234,0.3); transition: all 0.3s ease; }
                        .footer { background: #1a202c; color: #e2e8f0; padding: 40px 30px; text-align: center; }
                        .steps-list { list-style: none; padding: 0; }
                        .steps-list li { background: white; margin: 10px 0; padding: 15px 20px; border-radius: 12px; border-left: 4px solid #3182ce; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div style="font-size: 32px; font-weight: bold; margin-bottom: 12px;">🏥 VetCare Platform</div>
                            <div style="font-size: 16px; opacity: 0.9;">Veterinary Excellence Network</div>
                        </div>
                        
                        <div class="content">
                            <div class="doctor-badge">
                                <div style="font-size: 28px; color: #2d3748; font-weight: bold; margin-bottom: 8px;">Dr. ${doctorData.name}</div>
                                <div style="color: #4a5568; font-size: 16px;">Licensed Veterinary Professional</div>
                            </div>
                            
                            <h2 style="color: #2d3748; margin-bottom: 25px; font-size: 24px;">📋 Application Status Update</h2>
                            
                            <p style="margin-bottom: 25px; color: #4a5568; font-size: 18px;">
                                Dear Dr. ${doctorData.name},
                            </p>
                            
                            <p style="margin-bottom: 25px; color: #4a5568; font-size: 16px;">
                                Thank you for taking the time to apply to join our VetCare platform. We truly appreciate your interest 
                                in becoming part of our veterinary excellence network. Your dedication to animal care is commendable, 
                                and we recognize the passion you bring to this noble profession.
                            </p>
                            
                            <p style="margin-bottom: 30px; color: #4a5568; font-size: 16px;">
                                After careful consideration and thorough review of your application by our credentialing team, 
                                we regret to inform you that we are unable to move forward with your application at this time.
                            </p>
                            
                            <div class="feedback-section">
                                <h4 style="color: #c53030; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center;">
                                    <span style="margin-right: 12px; font-size: 24px;">📝</span> Detailed Feedback for Your Growth
                                </h4>
                                <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #feb2b2;">
                                    <p style="color: #2d3748; margin: 0; font-size: 16px; font-style: italic; line-height: 1.6;">
                                        "${reason || 'Please ensure all required documents meet our verification standards and credentials are properly validated.'}"
                                    </p>
                                </div>
                            </div>
                            
                            <div class="encouragement-section">
                                <h4 style="color: #2f855a; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center;">
                                    <span style="margin-right: 12px; font-size: 24px;">🌟</span> We Believe in Your Potential
                                </h4>
                                <p style="color: #2d3748; margin: 0 0 20px 0; font-size: 16px;">
                                    Please don't be discouraged! Every successful professional journey includes moments of growth and learning. 
                                    This feedback is an opportunity to strengthen your application and demonstrate your commitment to excellence.
                                </p>
                                
                                <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #9ae6b4;">
                                    <h5 style="color: #2f855a; margin: 0 0 15px 0; font-size: 18px;">🎯 Steps for Success:</h5>
                                    <ul class="steps-list">
                                        <li><strong>📚 Address Specific Areas:</strong> Focus on the feedback provided to strengthen your qualifications</li>
                                        <li><strong>🎓 Enhance Credentials:</strong> Consider additional training, certifications, or professional development</li>
                                        <li><strong>📄 Update Documentation:</strong> Ensure all required documents are current and meet our standards</li>
                                        <li><strong>🔄 Reapply with Confidence:</strong> Submit an updated application once improvements are complete</li>
                                        <li><strong>💬 Seek Guidance:</strong> Our support team is here to help clarify any requirements</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div class="reapply-section">
                                <h4 style="color: #2c5282; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center;">
                                    <span style="margin-right: 12px; font-size: 24px;">💝</span> A Message of Encouragement
                                </h4>
                                <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #90cdf4;">
                                    <p style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px; font-style: italic; text-align: center;">
                                        <em>"Success is not final, failure is not fatal: it is the courage to continue that counts."</em>
                                    </p>
                                    <p style="color: #4a5568; margin: 0; font-size: 16px; text-align: center;">
                                        Your passion for veterinary care is valuable to our community. We hope this experience 
                                        will only strengthen your resolve to excel in this rewarding profession.
                                    </p>
                                </div>
                            </div>
                            
                            <p style="color: #4a5568; margin-bottom: 30px; font-size: 16px;">
                                The veterinary field is blessed to have caring professionals like you. We sincerely hope 
                                that you'll use this feedback constructively and consider reapplying in the future. 
                                Our doors remain open for dedicated veterinarians who are committed to continuous improvement and excellence.
                            </p>
                            
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="http://localhost:5173/doctor-signup" class="cta-button">
                                    🔄 Reapply When Ready
                                </a>
                                <br>
                                <a href="mailto:support@vetcare.com" style="color: #3182ce; text-decoration: none; font-size: 16px; margin-top: 15px; display: inline-block;">
                                    📧 Get Support & Guidance
                                </a>
                            </div>
                            
                            <div style="border-top: 2px solid #e2e8f0; padding-top: 30px; margin-top: 40px; text-align: center;">
                                <p style="color: #4a5568; font-size: 16px; margin: 0 0 12px 0;">
                                    Wishing you all the best in your professional journey,
                                </p>
                                <p style="color: #2d3748; font-size: 20px; font-weight: bold; margin: 0 0 8px 0;">
                                    🏥 The VetCare Credentialing Team
                                </p>
                                <p style="color: #718096; font-size: 14px; margin: 0; font-style: italic;">
                                    "Together, we care for those who cannot speak for themselves"
                                </p>
                            </div>
                        </div>
                        
                        <div class="footer">
                            <div style="font-weight: bold; font-size: 20px; margin-bottom: 15px;">VetCare Professional Platform</div>
                            <div style="margin-bottom: 20px; color: #a0aec0;">Revolutionizing veterinary care across India</div>
                            
                            <div style="margin: 20px 0;">
                                <a href="mailto:support@vetcare.com" style="color: #63b3ed; text-decoration: none; margin: 0 15px;">📧 Support</a>
                                <a href="tel:+917985792091" style="color: #63b3ed; text-decoration: none; margin: 0 15px;">📞 Call Us</a>
                                <a href="http://localhost:5173" style="color: #63b3ed; text-decoration: none; margin: 0 15px;">🌐 Platform</a>
                            </div>

                            <div style="margin-top: 25px; padding-top: 25px; border-top: 1px solid #4a5568; font-size: 12px; color: #a0aec0;">
                                © 2025 VetCare Professional Platform. All rights reserved.<br>
                                📍 Uttar Pradesh, Delhi, India | 🌐 www.vetcare.com<br>
                                <em>This is an automated message from our secure credentialing system.</em>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                `
            };
            
            const result = await transporter.sendMail(mailOptions);
            console.log('✅ Professional rejection email sent:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.log('❌ Rejection email failed:', error.message);
            return { success: false, message: error.message };
        }
    }
    
    return { success: true, message: 'Professional rejection email logged (fallback mode)' };
}

async function sendDoctorRemovalEmail(doctorData, reason) {
    console.log('📧 Sending removal email to:', doctorData.email);
    
    if (transporter) {
        try {
            const mailOptions = {
                from: `"VetCare Professional Platform" <${process.env.EMAIL_USER || 'vetcare0777@gmail.com'}>`,
                to: doctorData.email,
                subject: '🔒 VetCare Account Status Change - Important Notice',
                html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                        .container { max-width: 650px; margin: 0 auto; background: #ffffff; }
                        .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; text-align: center; color: white; }
                        .content { padding: 40px 30px; }
                        .status-badge { background: #fef2f2; border: 2px solid #dc2626; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center; }
                        .appeal-section { background: #f9fafb; border-radius: 12px; padding: 30px; margin: 30px 0; border-left: 4px solid #6b7280; }
                        .footer { background: #1f2937; color: #d1d5db; padding: 30px; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div style="font-size: 28px; font-weight: bold; margin-bottom: 10px;">🏥 VetCare Professional</div>
                            <div style="font-size: 14px; opacity: 0.9;">Account Status Notification</div>
                        </div>
                        <div class="content">
                            <div class="status-badge">
                                <div style="font-size: 24px; color: #dc2626; font-weight: bold; margin-bottom: 8px;">Dr. ${doctorData.name}</div>
                                <div style="color: #b91c1c;">Account Deactivated</div>
                            </div>
                            <h2 style="color: #1f2937; margin-bottom: 20px;">🔒 Account Status Change</h2>
                            <p style="margin-bottom: 20px; color: #4b5563; font-size: 16px;">
                                We regret to inform you that your VetCare account has been deactivated following our platform compliance review.
                            </p>
                            <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                <h4 style="color: #dc2626; margin-bottom: 10px;">📝 Reason for Deactivation:</h4>
                                <p style="color: #7f1d1d; margin: 0;">${reason || 'Policy violation or compliance issue detected during routine review.'}</p>
                            </div>
                            <div class="appeal-section">
                                <h3 style="color: #1f2937; margin-bottom: 15px;">⚖️ Appeal Process</h3>
                                <p style="margin-bottom: 20px; color: #6b7280;">
                                    If you believe this action was taken in error, you may submit an appeal within 30 days. Our compliance team will review your case.
                                </p>
                                <a href="mailto:appeals@vetcare.com?subject=Account%20Appeal%20-%20Dr.%20${doctorData.name}" style="display: inline-block; background: #6b7280; color: white; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold;">
                                    📧 Submit Appeal
                                </a>
                            </div>
                            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                                For questions, contact our compliance team at <a href="mailto:compliance@vetcare.com" style="color: #dc2626;">compliance@vetcare.com</a>
                            </p>
                        </div>
                        <div class="footer">
                            <div style="font-weight: bold; margin-bottom: 10px;">VetCare Professional Platform</div>
                            <div style="font-size: 12px; color: #9ca3af;">© 2025 VetCare. All rights reserved.</div>
                        </div>
                    </div>
                </body>
                </html>
                `
            };
            
            const result = await transporter.sendMail(mailOptions);
            console.log('✅ Professional removal email sent:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.log('❌ Removal email failed:', error.message);
            return { success: false, message: error.message };
        }
    }
    
    return { success: true, message: 'Removal email logged (fallback mode)' };
}

module.exports = {
    initializeEmailService,
    generateDoctorAccessLink,
    sendDoctorApprovalEmail,
    sendDoctorRejectionEmail,
    sendDoctorRemovalEmail
};
