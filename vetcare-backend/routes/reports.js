const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Report = require('../models/Report');
const PDFDocument = require('pdfkit');
const { auth, adminOnly, doctorAuth, flexibleAuth } = require('../middleware/authMiddleware');

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

// Get all reports for a specific doctor by doctor ID (for frontend)
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: 'Invalid doctor ID format' });
    }
    
    const reports = await Report.find({ doctor: doctorId })
      .populate('farmer', 'name email phone')
      .populate('doctor', 'name specialization email')
      .populate('animal', 'name type age')
      .populate('appointment', 'date time reason petName')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${reports.length} reports for doctor ${doctorId}`);
    res.json(reports);
  } catch (error) {
    console.error('❌ Error fetching doctor reports:', error);
    res.status(500).json({ 
      message: 'Error fetching doctor reports', 
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
router.get('/:id/download', flexibleAuth, async (req, res) => {
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

    // ✅ Authorization check - users can only download their own reports, doctors and admins can download any
    if (req.userRole === 'user') {
      // For regular users, check if they own this report
      if (report.farmer && report.farmer._id.toString() !== req.user.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only download your own reports.' });
      }
      
      // ✅ Allow download regardless of payment status for now (for testing)
      // TODO: Re-enable payment check in production
      // if (!report.reportAccessible || report.paymentStatus !== 'paid') {
      //   return res.status(402).json({ 
      //     message: 'Payment required to access this report',
      //     paymentRequired: true,
      //     reportId: report._id,
      //     amount: report.cost?.total || 500,
      //     paymentStatus: report.paymentStatus
      //   });
      // }
    }
    // Doctors and admins can download any report without payment (no additional check needed)

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

// Get doctor analytics with revenue
router.get('/doctor/:doctorId/analytics', auth, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { month, year } = req.query;
    
    console.log(`📊 Fetching analytics for doctor: ${doctorId}`, { month, year });
    
    let dateFilter = {};
    
    // If month and year are specified, filter for that specific month
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 1);
      dateFilter = {
        createdAt: {
          $gte: startDate,
          $lt: endDate
        }
      };
      console.log(`📅 Filtering for ${year}-${month}:`, { startDate, endDate });
    }
    
    // Get all reports for the doctor (with optional date filter)
    const reports = await Report.find({ 
      doctor: doctorId,
      ...dateFilter 
    })
      .populate('animal', 'name type')
      .populate('appointment', 'consultationFee status')
      .sort({ createdAt: -1 });
    
    // Get current date for monthly calculations
    const now = new Date();
    const currentYear = parseInt(year) || now.getFullYear();
    const currentMonth = parseInt(month) ? parseInt(month) - 1 : now.getMonth();
    
    // Calculate basic metrics
    const totalConsultations = reports.length;
    const uniquePatients = [...new Set(reports.map(r => r.animal?._id?.toString()))].length;
    
    // Calculate success rate (successful treatments)
    const successfulTreatments = reports.filter(r => 
      r.clinicalNote && (
        r.clinicalNote.toLowerCase().includes('recovered') ||
        r.clinicalNote.toLowerCase().includes('successful') ||
        r.clinicalNote.toLowerCase().includes('cured') ||
        r.clinicalNote.toLowerCase().includes('healed')
      )
    ).length;
    const treatmentSuccess = totalConsultations > 0 ? Math.round((successfulTreatments / totalConsultations) * 100) : 0;
    
    // Calculate total revenue
    const totalRevenue = reports.reduce((sum, report) => {
      const fee = report.appointment?.consultationFee || 500; // Default fee if not set
      return sum + fee;
    }, 0);
    
    // If filtering by month, also get comparison with previous month
    let previousMonthData = null;
    if (month && year) {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const prevStartDate = new Date(prevYear, prevMonth, 1);
      const prevEndDate = new Date(currentYear, currentMonth, 1);
      
      const prevReports = await Report.find({ 
        doctor: doctorId,
        createdAt: {
          $gte: prevStartDate,
          $lt: prevEndDate
        }
      }).populate('appointment', 'consultationFee');
      
      previousMonthData = {
        consultations: prevReports.length,
        patients: [...new Set(prevReports.map(r => r.animal?._id?.toString()))].length,
        revenue: prevReports.reduce((sum, report) => {
          const fee = report.appointment?.consultationFee || 500;
          return sum + fee;
        }, 0)
      };
    }
    
    // Calculate monthly stats (if not filtering by specific month, show last 6 months)
    const monthlyStats = [];
    if (!month || !year) {
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(currentYear, currentMonth - i, 1);
        const nextMonth = new Date(currentYear, currentMonth - i + 1, 1);
        
        const monthReports = await Report.find({
          doctor: doctorId,
          createdAt: {
            $gte: targetDate,
            $lt: nextMonth
          }
        }).populate('appointment', 'consultationFee');
        
        const monthConsultations = monthReports.length;
        const monthPatients = [...new Set(monthReports.map(r => r.animal?._id?.toString()))].length;
        const monthRevenue = monthReports.reduce((sum, report) => {
          const fee = report.appointment?.consultationFee || 500;
          return sum + fee;
        }, 0);
        
        monthlyStats.push({
          month: targetDate.toLocaleDateString('en-US', { month: 'short' }),
          consultations: monthConsultations,
          patients: monthPatients,
          revenue: monthRevenue
        });
      }
    }
    
    // Calculate common diseases
    const diseaseCount = {};
    reports.forEach(report => {
      if (report.diagnosis) {
        const disease = report.diagnosis.toLowerCase();
        diseaseCount[disease] = (diseaseCount[disease] || 0) + 1;
      }
    });
    
    const commonDiseases = Object.entries(diseaseCount)
      .map(([disease, count]) => ({ disease, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Calculate average consultation time (dummy for now, can be enhanced with actual time tracking)
    const avgConsultationTime = 25;
    
    const analytics = {
      totalConsultations,
      totalPatients: uniquePatients,
      treatmentSuccess,
      avgConsultationTime,
      totalRevenue,
      monthlyRevenue: totalRevenue, // For specific month, this is the total for that month
      monthlyStats,
      commonDiseases,
      previousMonthData,
      selectedPeriod: month && year ? `${year}-${month.padStart(2, '0')}` : 'all-time',
      growthPercentage: previousMonthData ? 
        Math.round(((totalConsultations - previousMonthData.consultations) / Math.max(previousMonthData.consultations, 1)) * 100) : 0,
      revenueGrowth: previousMonthData ? 
        Math.round(((totalRevenue - previousMonthData.revenue) / Math.max(previousMonthData.revenue, 1)) * 100) : 0
    };
    
    console.log(`✅ Analytics calculated for doctor ${doctorId}:`, {
      period: analytics.selectedPeriod,
      consultations: totalConsultations,
      patients: uniquePatients,
      revenue: totalRevenue,
      growth: analytics.growthPercentage
    });
    
    res.json({
      success: true,
      analytics
    });
    
  } catch (error) {
    console.error('❌ Error fetching doctor analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

// Update clinical note for a report
router.put('/:reportId/clinical-note', flexibleAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { clinicalNote } = req.body;
    
    console.log(`📝 Updating clinical note for report: ${reportId}`);
    console.log(`👤 Authenticated user:`, req.user);
    console.log(`👤 User role:`, req.userRole);
    console.log(`� User object:`, req.userObj);
    console.log(`�📋 Clinical note data:`, clinicalNote);
    
    // Validate authentication
    if (!req.user) {
      console.error('❌ No authenticated user found');
      return res.status(401).json({ message: 'User authentication failed' });
    }
    
    const report = await Report.findByIdAndUpdate(
      reportId,
      { 
        $set: { 
          clinicalNote: {
            ...clinicalNote,
            addedAt: new Date(),
            addedBy: req.user // req.user is already the user ID
          }
        }
      },
      { new: true }
    ).populate('farmer', 'name email phone')
     .populate('animal', 'name species breed age')
     .populate('doctor', 'name');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    console.log('✅ Clinical note updated successfully');
    console.log('📋 Updated clinical note:', report.clinicalNote);
    res.json(report);
  } catch (error) {
    console.error('❌ Error updating clinical note:', error);
    res.status(500).json({ message: 'Error updating clinical note', error: error.message });
  }
});

module.exports = router;
