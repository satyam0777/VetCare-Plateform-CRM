const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory structure
const createUploadDirs = () => {
  const dirs = [
    'uploads',
    'uploads/images',
    'uploads/documents',
    'uploads/reports',
    'uploads/prescriptions',
    'uploads/licenses',
    'uploads/degrees',
    'uploads/photos',
    'uploads/certificates'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(` Created directory: ${dir}`);
    }
  });
};

// Initialize directories
createUploadDirs();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    // Determine subdirectory based on field name or file type
    if (file.fieldname === 'license') {
      uploadPath += 'licenses/';
    } else if (file.fieldname === 'degree') {
      uploadPath += 'degrees/';
    } else if (file.fieldname === 'experience') {
      uploadPath += 'certificates/';
    } else if (file.fieldname === 'photo') {
      uploadPath += 'photos/';
    } else if (file.fieldname === 'idProof') {
      uploadPath += 'documents/';
    } else if (file.mimetype.startsWith('image/')) {
      uploadPath += 'images/';
    } else if (file.mimetype === 'application/pdf') {
      uploadPath += 'documents/';
    } else {
      uploadPath += 'documents/';
    }
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  
  filename: (req, file, cb) => {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension).replace(/[^a-zA-Z0-9]/g, '_');
    
    cb(null, `${baseName}_${uniqueSuffix}${extension}`);
  }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    archives: ['application/zip', 'application/x-rar-compressed']
  };
  
  const allAllowedTypes = [
    ...allowedTypes.images,
    ...allowedTypes.documents,
    ...allowedTypes.archives
  ];
  
  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allAllowedTypes.join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files at once
  },
  fileFilter
});

// Export different configurations
module.exports = {
  single: upload.single('file'),
  multiple: upload.array('files', 5),
  fields: upload.fields([
    { name: 'images', maxCount: 3 },
    { name: 'documents', maxCount: 2 }
  ]),
  // Doctor verification documents
  doctorDocuments: upload.fields([
    { name: 'license', maxCount: 1 },
    { name: 'degree', maxCount: 1 },
    { name: 'experience', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'idProof', maxCount: 1 }
  ])
};