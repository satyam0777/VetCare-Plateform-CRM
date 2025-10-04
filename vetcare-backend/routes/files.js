// File serving route for uploaded documents
const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// @route   GET /api/files/:filename
// @desc    Serve uploaded files (documents, images, etc.)
// @access  Admin/Doctor only (should add proper authentication)
router.get('/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Search in all possible upload directories
    const uploadDirs = [
      'uploads/licenses',
      'uploads/degrees', 
      'uploads/certificates',
      'uploads/photos',
      'uploads/documents',
      'uploads/images',
      'uploads/prescriptions',
      'uploads/reports',
      'uploads'
    ];
    
    let filePath = null;
    let foundPath = null;
    
    // Search for the file in all directories
    for (const dir of uploadDirs) {
      const testPath = path.join(__dirname, '..', dir, filename);
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        foundPath = dir;
        break;
      }
    }
    
    // Check if file exists
    if (!filePath || !fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filename}`);
      return res.status(404).json({ message: 'File not found' });
    }
    
    console.log(`✅ Serving file: ${filename} from ${foundPath}`);
    
    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const contentType = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    
    // Set CORS headers for frontend access
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    res.setHeader('Content-Type', contentType[ext] || 'application/octet-stream');
    
    // For PDF files, set disposition to inline so they can be viewed in browser
    if (ext === '.pdf') {
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      res.status(500).json({ message: 'Error serving file' });
    });
    
  } catch (error) {
    console.error('File serving error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;