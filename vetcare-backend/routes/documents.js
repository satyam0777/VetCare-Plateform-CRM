const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const Doctor = require('../models/Doctor');
const { auth, adminOnly } = require('../middleware/authMiddleware');
const { getSignedUrl, deleteDocument, cloudinary } = require('../services/cloudStorageService');

// Get document securely (for admin/doctor/owner only)
router.get('/secure/:documentId', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.documentId)
      .populate('uploadedBy', 'name email role')
      .populate('relatedDoctor', 'name email');

    if (!document || !document.isActive) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check access permissions
    const userRole = req.userRole;
    const userId = req.user;
    
    const canAccess = (
      userRole === 'admin' || // Admin can access all documents
      document.uploadedBy._id.toString() === userId || // Owner can access their documents
      (document.relatedDoctor && document.relatedDoctor._id.toString() === userId) || // Doctor can access their documents
      document.isPublic // Public documents
    );

    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied to this document' });
    }

    // Record access
    await document.recordAccess();

    // For cloud storage, redirect to the actual URL or provide signed URL
    if (process.env.STORAGE_TYPE === 's3' && !document.isPublic) {
      // Generate signed URL for private S3 documents
      const signedUrl = getSignedUrl(document.s3Key, 3600); // 1 hour expiry
      return res.redirect(signedUrl);
    } else if (process.env.STORAGE_TYPE === 'cloudinary') {
      // For Cloudinary, can redirect directly or provide secure URL
      return res.redirect(document.url);
    } else {
      // For local storage (development only)
      const path = require('path');
      const filePath = path.join(__dirname, '..', document.localPath);
      return res.sendFile(filePath);
    }

  } catch (error) {
    console.error('Error accessing document:', error);
    res.status(500).json({ error: 'Failed to access document' });
  }
});

// Admin: Get all pending documents for verification
router.get('/admin/pending', adminOnly, async (req, res) => {
  try {
    const pendingDocuments = await Document.getPendingDocuments();
    
    // Group documents by doctor
    const groupedDocuments = pendingDocuments.reduce((acc, doc) => {
      const doctorId = doc.relatedDoctor?._id || 'unknown';
      if (!acc[doctorId]) {
        acc[doctorId] = {
          doctor: doc.relatedDoctor,
          documents: []
        };
      }
      acc[doctorId].documents.push(doc);
      return acc;
    }, {});

    res.json({
      success: true,
      pendingDocuments: Object.values(groupedDocuments),
      totalPending: pendingDocuments.length
    });

  } catch (error) {
    console.error('Error fetching pending documents:', error);
    res.status(500).json({ error: 'Failed to fetch pending documents' });
  }
});

// Admin: Get documents by doctor
router.get('/admin/doctor/:doctorId', adminOnly, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status } = req.query;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const documents = await Document.getDocumentsByDoctor(doctorId, status);

    res.json({
      success: true,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization
      },
      documents
    });

  } catch (error) {
    console.error('Error fetching doctor documents:', error);
    res.status(500).json({ error: 'Failed to fetch doctor documents' });
  }
});

// Admin: Verify/Reject document
router.put('/admin/verify/:documentId', adminOnly, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { action, notes, rejectionReason } = req.body;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (action === 'approve') {
      document.verificationStatus = 'approved';
      document.verifiedBy = req.user;
      document.verifiedAt = new Date();
      document.verificationNotes = notes;
    } else if (action === 'reject') {
      document.verificationStatus = 'rejected';
      document.verifiedBy = req.user;
      document.verifiedAt = new Date();
      document.rejectionReason = rejectionReason;
      document.verificationNotes = notes;
    } else {
      return res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });
    }

    await document.save();

    // Update doctor's verification status if all required documents are approved
    if (action === 'approve' && document.relatedDoctor) {
      await updateDoctorVerificationStatus(document.relatedDoctor);
    }

    // Send email notification to doctor
    if (document.relatedDoctor) {
      await sendDocumentVerificationEmail(document.relatedDoctor, document, action);
    }

    res.json({
      success: true,
      message: `Document ${action}d successfully`,
      document
    });

  } catch (error) {
    console.error('Error verifying document:', error);
    res.status(500).json({ error: 'Failed to verify document' });
  }
});

// Admin: Delete document
router.delete('/admin/:documentId', adminOnly, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { reason } = req.body;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete from cloud storage
    let deletedFromCloud = true;
    if (document.cloudinaryId) {
      deletedFromCloud = await deleteDocument(null, document.cloudinaryId);
    } else if (document.s3Key) {
      deletedFromCloud = await deleteDocument(document.s3Key);
    }

    if (!deletedFromCloud) {
      console.warn('Failed to delete document from cloud storage, but continuing with database deletion');
    }

    // Soft delete - mark as inactive
    document.isActive = false;
    document.adminNotes = reason || 'Deleted by admin';
    await document.save();

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Doctor: Get my documents
router.get('/my-documents', auth, async (req, res) => {
  try {
    const documents = await Document.find({
      uploadedBy: req.user,
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      documents
    });

  } catch (error) {
    console.error('Error fetching user documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Helper function to update doctor verification status
const updateDoctorVerificationStatus = async (doctorId) => {
  try {
    const requiredDocuments = ['license', 'degree', 'photo', 'idProof'];
    const approvedDocuments = await Document.find({
      relatedDoctor: doctorId,
      verificationStatus: 'approved',
      isActive: true,
      documentType: { $in: requiredDocuments }
    });

    const approvedTypes = approvedDocuments.map(doc => doc.documentType);
    const allRequiredApproved = requiredDocuments.every(type => approvedTypes.includes(type));

    if (allRequiredApproved) {
      await Doctor.findByIdAndUpdate(doctorId, {
        verificationStatus: 'approved',
        verificationDate: new Date(),
        status: 'active'
      });
      
      console.log(`✅ Doctor ${doctorId} fully verified - all documents approved`);
    }

  } catch (error) {
    console.error('Error updating doctor verification status:', error);
  }
};

// Helper function to send email notification
const sendDocumentVerificationEmail = async (doctorId, document, action) => {
  try {
    // This would integrate with your email service
    console.log(`📧 Should send ${action} email for document ${document.documentType} to doctor ${doctorId}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
};

module.exports = router;