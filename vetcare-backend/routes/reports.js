const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Report = require('../models/Report');
const PDFDocument = require('pdfkit');
const { auth } = require('../middleware/authMiddleware');

// Helper function to check if user is admin
const isAdminUser = (userId, userRole) => {
  return userId === 'admin' || userRole === 'admin';
};

// Get all reports for authenticated user
router.get('/user', auth, async (req, res) => {
  try {
    let userId = req.user;
    
    // Handle admin users - they don't have personal reports
    if (isAdminUser(userId, req.userRole)) {
      return res.json({
        message: 'Admin users do not have personal reports',
        count: 0,
        data: []
      });
    }
    
    if (Buffer.isBuffer(userId)) {
      userId = userId.toString('hex');
    } else if (userId && typeof userId === 'object' && userId._id) {
      userId = userId._id.toString();
    } else {
      userId = userId.toString();
    }
    const reports = await Report.find({ farmer: userId })
      .populate('doctor', 'name specialization email')
      .populate('animal', 'name type age')
      .sort({ createdAt: -1 });
    res.json({
      message: 'Reports fetched successfully',
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error('❌ Error fetching user reports:', error);
    res.status(500).json({ 
      message: 'Error fetching reports', 
      error: error.message 
    });
  }
});

// Get all reports for authenticated doctor
router.get('/doctor', auth, async (req, res) => {
  try {
    let doctorId = req.user;
    
    if (Buffer.isBuffer(doctorId)) {
      doctorId = doctorId.toString('hex');
    } else if (doctorId && typeof doctorId === 'object' && doctorId._id) {
      doctorId = doctorId._id.toString();
    } else {
      doctorId = doctorId.toString();
    }
    const reports = await Report.find({ doctor: doctorId })
      .populate('farmer', 'name email phone')
      .populate('animal', 'name type age')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('❌ Error fetching doctor reports:', error);
    res.status(500).json({ 
      message: 'Error fetching reports', 
      error: error.message 
    });
  }
});

// Helper function for PDF rectangles
function drawRoundedRect(doc, x, y, width, height, radius, fillColor, borderColor) {
  if (fillColor) {
    doc.save().fillColor(fillColor).roundedRect(x, y, width, height, radius).fill();
  }
  if (borderColor) {
    doc.save().strokeColor(borderColor).lineWidth(1).roundedRect(x, y, width, height, radius).stroke();
  }
}

// Download report as PDF
router.get('/:id/download', auth, async (req, res) => {
  try {
    const reportId = req.params.id;
    let userId = req.user;
    
    if (Buffer.isBuffer(userId)) {
      userId = userId.toString('hex');
    } else if (userId && typeof userId === 'object' && userId._id) {
      userId = userId._id.toString();
    } else {
      userId = userId.toString();
    }

    const report = await Report.findById(reportId)
      .populate('farmer', 'name email phone address')
      .populate('doctor', 'name specialization email experience licenseNumber')
      .populate('animal', 'name type age gender breed healthStatus')
      .populate('appointment', 'date time reason');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // ✅ Enhanced debug logging to see raw IDs
    console.log('📊 Report data check:', {
      reportId: report._id,
      rawDoctorId: report.doctor, // This will show if it's an ObjectId or null
      hasfarmer: !!report.farmer,
      hasDoctor: !!report.doctor,
      hasAnimal: !!report.animal,
      farmerData: report.farmer ? 'populated' : 'null',
      doctorData: report.doctor ? 'populated' : 'null',
      animalData: report.animal ? 'populated' : 'null'
    });

    // Let's also check the raw report document
    const rawReport = await Report.findById(reportId).select('doctor farmer animal');
    console.log('🔍 Raw report IDs:', {
      doctorId: rawReport.doctor,
      farmerId: rawReport.farmer,
      animalId: rawReport.animal
    });

    // ✅ Handle missing doctor data gracefully
    if (!report.farmer || !report.animal) {
      console.log('❌ Missing critical data:', {
        farmer: report.farmer,
        animal: report.animal
      });
      return res.status(400).json({ 
        message: 'Report data incomplete - missing farmer or animal records',
        missing: {
          farmer: !report.farmer,
          animal: !report.animal
        }
      });
    }

    // ✅ Handle missing doctor gracefully
    if (!report.doctor) {
      console.log('⚠️ Report has no doctor - using system generated report');
      // For reports without doctor, allow access to farmer only
      const farmerId = report.farmer._id.toString();
      if (userId !== farmerId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else {
      // Normal case with doctor
      const farmerId = report.farmer._id.toString();
      const doctorId = report.doctor._id.toString();
      
      if (userId !== farmerId && userId !== doctorId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    const doc = new PDFDocument({ 
      size: 'A4',
      margin: 50,
      info: {
        Title: `Medical Report - ${report.animal.name}`,
        Author: 'VetCare Professional',
        Subject: 'Veterinary Medical Report',
        Creator: 'VetCare Platform'
      }
    });

    const filename = `VetCare_Report_${report.animal.name}_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    let currentY = 40; // Start higher on page

    // Modern Header with gradient design
    drawRoundedRect(doc, 30, currentY, doc.page.width - 60, 65, 10, '#2563eb', '#2563eb');
    doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('VETCARE PROFESSIONAL', 50, currentY + 12);
    doc.fillColor('#dbeafe').fontSize(11).font('Helvetica').text('Advanced Veterinary Care & Medical Excellence', 50, currentY + 38);
    doc.fillColor('#ffffff').fontSize(10).text(`Report Generated: ${new Date().toLocaleDateString('en-IN')}`, doc.page.width - 180, currentY + 12);
    doc.fillColor('#bfdbfe').fontSize(9).text(`Report ID: #${reportId.slice(-8).toUpperCase()}`, doc.page.width - 180, currentY + 26);

    currentY += 80;

    // Compact Status Badge
    drawRoundedRect(doc, 30, currentY, 150, 22, 4, '#10b981', '#10b981');
    doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text('MEDICAL REPORT', 40, currentY + 6);

    currentY += 35;

    // Modern Patient & Doctor Cards (More compact)
    const cardWidth = (doc.page.width - 80) / 2;
    
    // Patient Card - Modern flat design
    drawRoundedRect(doc, 30, currentY, cardWidth, 85, 6, '#f8fafc', '#e5e7eb');
    doc.fillColor('#1f2937').fontSize(12).font('Helvetica-Bold').text('PATIENT INFORMATION', 40, currentY + 8);
    doc.fillColor('#374151').fontSize(9).font('Helvetica')
       .text(`Owner: ${report.farmer.name}`, 40, currentY + 25, { width: cardWidth - 20 })
       .text(`Email: ${report.farmer.email}`, 40, currentY + 37, { width: cardWidth - 20 })
       .text(`Phone: ${report.farmer.phone || 'Not provided'}`, 40, currentY + 49, { width: cardWidth - 20 });
    doc.fillColor('#6b7280').fontSize(8).font('Helvetica')
       .text(`Pet: ${report.animal.name} • ${report.animal.type} • ${report.animal.age}y • ${report.animal.gender}`, 40, currentY + 63, { width: cardWidth - 20 })
       .text(`Health Status: ${report.animal.healthStatus}`, 40, currentY + 75, { width: cardWidth - 20 });

    // Doctor Card - Modern flat design
    const doctorCardX = 50 + cardWidth;
    drawRoundedRect(doc, doctorCardX, currentY, cardWidth, 85, 6, '#eff6ff', '#3b82f6');
    doc.fillColor('#1e40af').fontSize(12).font('Helvetica-Bold').text('ATTENDING DOCTOR', doctorCardX + 10, currentY + 8);
    doc.fillColor('#374151').fontSize(9).font('Helvetica');
    
    // ✅ Handle missing doctor data gracefully
    if (report.doctor) {
      doc.text(`Dr. ${report.doctor.name}`, doctorCardX + 10, currentY + 25, { width: cardWidth - 20 })
         .text(`${report.doctor.specialization}`, doctorCardX + 10, currentY + 37, { width: cardWidth - 20 })
         .text(`Experience: ${report.doctor.experience} years`, doctorCardX + 10, currentY + 49, { width: cardWidth - 20 });
      doc.fillColor('#6b7280').fontSize(8).font('Helvetica')
         .text(`Email: ${report.doctor.email}`, doctorCardX + 10, currentY + 63, { width: cardWidth - 20 })
         .text(`License: ${report.doctor.licenseNumber || 'Verified'}`, doctorCardX + 10, currentY + 75, { width: cardWidth - 20 });
    } else {
      doc.text(`System Generated Report`, doctorCardX + 10, currentY + 25, { width: cardWidth - 20 })
         .text(`VetCare Platform`, doctorCardX + 10, currentY + 37, { width: cardWidth - 20 })
         .text(`Automated Report System`, doctorCardX + 10, currentY + 49, { width: cardWidth - 20 });
      doc.fillColor('#6b7280').fontSize(8).font('Helvetica')
         .text(`Email: support@vetcare.com`, doctorCardX + 10, currentY + 63, { width: cardWidth - 20 })
         .text(`System Generated`, doctorCardX + 10, currentY + 75, { width: cardWidth - 20 });
    }

    currentY += 100;

    // Modern Medical Assessment Section
    drawRoundedRect(doc, 30, currentY, doc.page.width - 60, 20, 4, '#fef3c7', '#f59e0b');
    doc.fillColor('#92400e').fontSize(13).font('Helvetica-Bold').text('MEDICAL ASSESSMENT', 40, currentY + 5);
    currentY += 28;

    if (report.appointment && report.appointment.reason) {
      doc.fillColor('#dc2626').fontSize(10).font('Helvetica-Bold').text('CHIEF COMPLAINT:', 40, currentY);
      doc.fillColor('#1f2937').fontSize(9).font('Helvetica').text(report.appointment.reason, 150, currentY, { width: doc.page.width - 190 });
      currentY += 18;
    }

    if (report.symptoms && report.symptoms.length > 0) {
      doc.fillColor('#dc2626').fontSize(10).font('Helvetica-Bold').text('SYMPTOMS:', 40, currentY);
      doc.fillColor('#1f2937').fontSize(9).font('Helvetica').text(report.symptoms.join(', '), 110, currentY, { width: doc.page.width - 150 });
      currentY += 18;
    }

    if (report.diagnosis) {
      doc.fillColor('#dc2626').fontSize(10).font('Helvetica-Bold').text('DIAGNOSIS:', 40, currentY);
      doc.fillColor('#1f2937').fontSize(9).font('Helvetica').text(report.diagnosis, 110, currentY, { width: doc.page.width - 150 });
      currentY += 18;
    }

    if (report.treatment) {
      doc.fillColor('#dc2626').fontSize(10).font('Helvetica-Bold').text('TREATMENT:', 40, currentY);
      doc.fillColor('#1f2937').fontSize(9).font('Helvetica').text(report.treatment, 110, currentY, { width: doc.page.width - 150 });
      currentY += 20;
    }

    // Prescriptions
    if (report.prescriptions && report.prescriptions.length > 0) {
      drawRoundedRect(doc, 50, currentY, doc.page.width - 100, 25, 6, '#f0fdf4', '#22c55e');
      doc.fillColor('#166534').fontSize(16).font('Helvetica-Bold').text('PRESCRIPTIONS', 60, currentY + 6);
      currentY += 30;

      doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold')
         .text('MEDICINE', 60, currentY)
         .text('DOSAGE', 180, currentY)
         .text('FREQUENCY', 260, currentY)
         .text('DURATION', 340, currentY)
         .text('INSTRUCTIONS', 420, currentY);

      currentY += 12;
      doc.strokeColor('#d1d5db').lineWidth(0.5).moveTo(50, currentY).lineTo(doc.page.width - 50, currentY).stroke();
      currentY += 6;

      report.prescriptions.forEach((prescription, index) => {
        doc.fillColor('#1f2937').fontSize(8).font('Helvetica')
           .text(prescription.medicineName || 'N/A', 60, currentY, { width: 115 })
           .text(prescription.dosage || 'N/A', 180, currentY, { width: 75 })
           .text(prescription.frequency || 'N/A', 260, currentY, { width: 75 })
           .text(prescription.duration || 'N/A', 340, currentY, { width: 70 })
           .text(prescription.instructions || 'As directed', 420, currentY, { width: 100 });

        currentY += 10;
        if (index < report.prescriptions.length - 1) {
          doc.strokeColor('#f3f4f6').lineWidth(0.3).moveTo(50, currentY + 1).lineTo(doc.page.width - 50, currentY + 1).stroke();
          currentY += 2;
        }
      });

      currentY += 12;
    }

    // Recommendations
    if (report.recommendations) {
      doc.fillColor('#059669').fontSize(10).font('Helvetica-Bold').text('RECOMMENDATIONS:', 40, currentY);
      doc.fillColor('#1f2937').fontSize(9).font('Helvetica').text(report.recommendations, 170, currentY, { width: doc.page.width - 210 });
      currentY += 22;
    }

    // Doctor Notes
    if (report.doctorNotes) {
      doc.fillColor('#7c3aed').fontSize(10).font('Helvetica-Bold').text('DOCTOR NOTES:', 40, currentY);
      doc.fillColor('#1f2937').fontSize(9).font('Helvetica').text(report.doctorNotes, 140, currentY, { width: doc.page.width - 180 });
      currentY += 20;
    }

    // Billing
    if (report.cost && report.cost.total > 0) {
      drawRoundedRect(doc, 50, currentY, doc.page.width - 100, 50, 6, '#ecfeff', '#06b6d4');
      doc.fillColor('#0891b2').fontSize(14).font('Helvetica-Bold').text('BILLING SUMMARY', 60, currentY + 6);
      doc.fillColor('#374151').fontSize(10).font('Helvetica')
         .text(`Consultation Fee: Rs.${report.cost.consultationFee || 0}`, 60, currentY + 22)
         .text(`Medicine Cost: Rs.${report.cost.medicinesCost || 0}`, 60, currentY + 34);

      drawRoundedRect(doc, doc.page.width - 180, currentY + 22, 120, 20, 3, '#dcfce7', '#16a34a');
      doc.fillColor('#15803d').fontSize(12).font('Helvetica-Bold').text(`Total: Rs.${report.cost.total}`, doc.page.width - 165, currentY + 28);
      currentY += 58;
    }

    // Signature Section - More Compact
    drawRoundedRect(doc, 50, currentY, doc.page.width - 100, 42, 6, '#f8fafc', '#e2e8f0');
    doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('DIGITAL VERIFICATION', 60, currentY + 6);
    
    // ✅ Handle missing doctor data in signature section
    if (report.doctor) {
      doc.fillColor('#1e40af').fontSize(10).font('Helvetica-Bold').text(`Dr. ${report.doctor.name}`, 60, currentY + 20);
      doc.fillColor('#6b7280').fontSize(8).font('Helvetica').text(`${report.doctor.specialization} | License: ${report.doctor.licenseNumber || 'Verified'}`, 60, currentY + 32);
    } else {
      doc.fillColor('#1e40af').fontSize(10).font('Helvetica-Bold').text(`VetCare System`, 60, currentY + 20);
      doc.fillColor('#6b7280').fontSize(8).font('Helvetica').text(`Automated Report System | System Generated`, 60, currentY + 32);
    }
    doc.fillColor('#6b7280').fontSize(8).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`, doc.page.width - 130, currentY + 20);

    currentY += 48;

    // Compact Footer - Single Line
    doc.fillColor('#9ca3af').fontSize(7).font('Helvetica')
       .text('VetCare Professional | support@vetcare.com | +91-VETCARE | This is a digitally generated report', 50, currentY, { align: 'center', width: doc.page.width - 100 });

    doc.end();

  } catch (error) {
    console.error('❌ Error generating PDF report:', error);
    res.status(500).json({ 
      message: 'Error generating PDF report', 
      error: error.message 
    });
  }
});

module.exports = router;
