const { body, validationResult } = require('express-validator');

// Helper: handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

// Registration validator
const validateRegistration = [
  // common fields for all roles
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .isString()
    .withMessage('First name must be string'),
  body('last_name')
    .notEmpty()
    .withMessage('Last name is required')
    .isString()
    .withMessage('Last name must be a string'),
  body('phone').optional().isString().withMessage('Phone must be string'),
  body('role')
    .optional()
    .isIn(['member', 'trainer'])
    .withMessage('Public registration only allows: member, trainer'),

  // member specific fields (if role === "member")
  body('date_of_birth')
    .if(body('role').equals('member'))
    .notEmpty()
    .withMessage('Date of birth is required for members')
    .isISO8601()
    .withMessage('Date of birth must be \'a valid date (YYYY-MM-DD)'),
  body('gender')
    .if(body('role').equals('member'))
    .notEmpty()
    .withMessage('Gender is required for members')
    .isIn(['male', 'female'])
    .withMessage('Gender must be "male" or "female"'),
  body('fitness_goal')
    .if(body('role').equals('member'))
    .notEmpty()
    .withMessage('Fitness goal is required for members')
    .isIn(['weight_loss', 'muscle_building', 'maintenance', 'general_fitness'])
    .withMessage('Invalid fitness goal'),
  body('emergency_contact_name')
    .if(body('role').equals('member'))
    .notEmpty()
    .withMessage('Emergency contact name is required for members'),
  body('emergency_contact_phone')
    .if(body('role').equals('member'))
    .notEmpty()
    .withMessage('Emergency contact phone is required for members'),
  body('blood_type')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood type'),
  body('dietary_restrictions')
    .optional()
    .isString()
    .withMessage('Dietary restrictions must be a string'),

  // Trainer specific fields (if role === "trainer")
  body('specialty')
    .if(body('role').equals('trainer'))
    .notEmpty()
    .withMessage('Specialty is required for trainers'),
  body('years_of_experience')
    .if(body('role').equals('trainer'))
    .notEmpty()
    .withMessage('Years of experience is required for trainers')
    .isInt({ min: 0 })
    .withMessage('Years of experience must be a positive integer'),
  body('certification')
    .if(body('role').equals('trainer'))
    .notEmpty()
    .withMessage('Certification is required for trainers'),
  body('hourly_rate')
    .if(body('role').equals('trainer'))
    .notEmpty()
    .withMessage('Hourly rate is required for trainers')
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  body('bio').optional().isString().withMessage('Bio must be a string'),

  handleValidationErrors,
];

// Login validator
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),

  handleValidationErrors,
];

const validateForgotPassword = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),

  handleValidationErrors,
];

const validateResetPassword = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isString()
    .withMessage('Reset token must be a string'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long'),

  handleValidationErrors,
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
};
