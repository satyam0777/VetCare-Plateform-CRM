const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Common validation rules
const emailValidation = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Please provide a valid email');

const passwordValidation = body('password')
  .isLength({ min: 8 })
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');

const nameValidation = body('name')
  .trim()
  .isLength({ min: 2, max: 50 })
  .matches(/^[a-zA-Z\s]+$/)
  .withMessage('Name must be 2-50 characters long and contain only letters and spaces');

const phoneValidation = body('phone')
  .optional()
  .isMobilePhone()
  .withMessage('Please provide a valid phone number');

const mongoIdValidation = param('id')
  .isMongoId()
  .withMessage('Invalid ID format');

// Auth validation rules
const registerValidation = [
  nameValidation,
  emailValidation,
  passwordValidation,
  phoneValidation,
  body('role')
    .optional()
    .isIn(['user', 'farmer', 'doctor'])
    .withMessage('Invalid role'),
  validate
];

const loginValidation = [
  emailValidation,
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  mongoIdValidation,
  emailValidation,
  passwordValidation,
  nameValidation,
  phoneValidation
};