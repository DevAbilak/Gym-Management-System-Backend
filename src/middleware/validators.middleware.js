const { body, validationResult, param, query } = require('express-validator');
const { sendError, ErrorCodes } = require('../utils/response');

// Helper: handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(
      res,
      'Validation failed',
      ErrorCodes.VALIDATION_ERROR,
      400,
      errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    );
  }

  next();
};

// ----------------- AUTH VALIDATORS ------------------
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

// Forgot password validator
const validateForgotPassword = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),

  handleValidationErrors,
];

// Reset password validator
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

// ----------------- CLASS VALIDATORS ------------------
// create class validator
const validateCreateClass = [
  body('trainer_id')
    .notEmpty()
    .withMessage('trainer_id is required')
    .isUUID()
    .withMessage('trainer_id must be a valid UUID'),
  body('name')
    .notEmpty()
    .withMessage('Class name is required')
    .isString()
    .withMessage('Class name must be a string'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  body('category')
    .optional()
    .isIn(['yoga', 'pilates', 'hiit', 'spin', 'strength', 'dance', 'other'])
    .withMessage('Invalid category'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  body('capacity')
    .notEmpty()
    .withMessage('Capacity is required')
    .isInt({ min: 1 })
    .withMessage('Capacity must be at least 1'),
  body('start_time')
    .notEmpty()
    .withMessage('start_time is required')
    .isISO8601()
    .withMessage('start_time must be a valid ISO datetime'),
  body('end_time')
    .notEmpty()
    .withMessage('end_time is required')
    .isISO8601()
    .withMessage('end_time must be a valid ISO datetime'),
  body('location')
    .optional()
    .isString()
    .withMessage('Location must be a string'),

  handleValidationErrors,
];

// update class validator
const validateUpdateClass = [
  param('id').isUUID().withMessage('Invalid class ID format'),
  body('name').optional().isString().withMessage('Name must be a string'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  body('category')
    .optional()
    .isIn(['yoga', 'pilates', 'hiit', 'spin', 'strength', 'dance', 'other'])
    .withMessage('Invalid category'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  body('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity must be at least 1'),
  body('start_time')
    .optional()
    .isISO8601()
    .withMessage('start_time must be a valid ISO datetime'),
  body('end_time')
    .optional()
    .isISO8601()
    .withMessage('end_time must be a valid ISO datetime'),
  body('location')
    .optional()
    .isString()
    .withMessage('Location must be a string'),
  body('status')
    .optional()
    .isIn(['scheduled', 'cancelled', 'completed'])
    .withMessage('Invalid status'),

  handleValidationErrors,
];

// ----------------- MEMBER VALIDATORS ------------------
// validate get member by id
const validateGetMemberById = [
  param('id').isUUID().withMessage('Invalid member ID format'),
  handleValidationErrors,
];

// validate get member by user id
const validateGetMemberByUserId = [
  param('userId').isUUID().withMessage('Invalid user ID format'),
  handleValidationErrors,
];

// validate get member by Unique Member ID (GYM-XXXX-X)
const validateGetMemberByUniqueId = [
  param('uniqueMemberId')
    .notEmpty()
    .withMessage('Unique member ID is required')
    .matches(/^GYM-[A-Z0-9]{4}-[0-9]$/)
    .withMessage(
      'Unique member ID must follow the format: GYM-XXXX-X (e.g., GYM-A3F9-7)',
    ),
  handleValidationErrors,
];

// validate update member
const validateUpdateMember = [
  param('id').isUUID().withMessage('Invalid member ID format'),
  body('date_of_birth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date (YYYY-MM-DD)'),
  body('gender')
    .optional()
    .isIn(['male', 'female'])
    .withMessage('Gender must be "male" or "female"'),
  body('blood_type')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood type'),
  body('dietary_restrictions')
    .optional()
    .isString()
    .withMessage('Dietary restrictions must be a string'),
  body('fitness_goal')
    .optional()
    .isIn(['weight_loss', 'muscle_building', 'maintenance', 'general_fitness'])
    .withMessage('Invalid fitness goal'),
  body('emergency_contact_name')
    .optional()
    .isString()
    .withMessage('Emergency contact name must be a string'),
  body('emergency_contact_phone')
    .optional()
    .isString()
    .withMessage('Emergency contact phone must be a string'),
  handleValidationErrors,
];

// validate activate.deactivate member
const validateDeactivateUser = [
  param('id').isUUID().withMessage('Invalid user/member ID format'),
  handleValidationErrors,
];

// ----------------- CHECK-IN VALIDATORS ------------------

// Validate unique member ID
const validateCheckInMember = [
  param('uniqueId')
    .notEmpty()
    .withMessage('uniqueId is required')
    .matches(/^GYM-[A-Z0-9]{4}-[0-9]$/)
    .withMessage(
      'Unique member ID must follow the format: GYM-XXXX-X (e.g., GYM-A3F9-7)',
    ),

  handleValidationErrors,
];

// Validate override check-in
const validateOverrideCheckIn = [
  param('uniqueId')
    .notEmpty()
    .withMessage('uniqueId is required')
    .matches(/^GYM-[A-Z0-9]{4}-[0-9]$/)
    .withMessage(
      'Unique member ID must follow the format: GYM-XXXX-X (e.g., GYM-A3F9-7)',
    ),

  body('reason')
    .notEmpty()
    .withMessage('Override reason is required')
    .isString()
    .withMessage('Reason must be a string'),

  handleValidationErrors,
];

// Validate check-in history
const validateCheckInHistory = [
  param('memberId').isUUID().withMessage('Invalid member ID format'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

// ----------------- TRAINER VALIDATORS ------------------

// Get trainer by ID validator
const validateGetTrainerById = [
  param('id').isUUID().withMessage('Invalid trainer ID format'),
  handleValidationErrors,
];

// Update trainer validator
const validateUpdateTrainer = [
  param('id').isUUID().withMessage('Invalid trainer ID format'),
  body('specialty')
    .optional()
    .isString()
    .withMessage('Specialty must be a string'),
  body('years_of_experience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Years of experience must be a positive integer'),
  body('certification')
    .optional()
    .isString()
    .withMessage('Certification must be a string'),
  body('hourly_rate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  body('bio').optional().isString().withMessage('Bio must be a string'),
  body('is_available')
    .optional()
    .isBoolean()
    .withMessage('is_available must be a boolean'),
  handleValidationErrors,
];

// Trainer schedule
const validateGetTrainerSchedule = [
  param('id').isUUID().withMessage('Invalid trainer ID format'),
  query('date')
    .optional()
    .isISO8601()
    .withMessage('date must be a valid date (YYYY-MM-DD)'),
  handleValidationErrors,
];

// Get trainer roster validator
const validateGetTrainerRoster = [
  param('id').isUUID().withMessage('Invalid trainer ID format'),
  handleValidationErrors,
];

// Class roster
const validateClassRoster = [
  param('trainerId').isUUID().withMessage('trainerId must be a valid UUID'),

  param('classId').isUUID().withMessage('classId must be a valid UUID'),

  handleValidationErrors,
];

// Assign workout / meal plan
// const validateAssignPlan = [
//   param("trainerId").isUUID().withMessage("trainerId must be a valid UUID"),

//   body("member_profile_id")
//     .notEmpty()
//     .withMessage("member_profile_id is required")
//     .isUUID()
//     .withMessage("member_profile_id must be a valid UUID"),

//   body("workout_template_id")
//     .optional({ nullable: true })
//     .isUUID()
//     .withMessage("workout_template_id must be a valid UUID"),

//   body("meal_plan_id")
//     .optional({ nullable: true })
//     .isUUID()
//     .withMessage("meal_plan_id must be a valid UUID"),

//   body("notes").optional().isString().withMessage("notes must be a string"),

//   handleValidationErrors,
// ];

// Personal training attendance
const validatePersonalTrainingAttendance = [
  param('memberProfileId')
    .isUUID()
    .withMessage('memberProfileId must be a valid UUID'),

  body('notes').optional().isString().withMessage('notes must be a string'),

  handleValidationErrors,
];

// Get client feedback validator
const validateGetClientFeedback = [
  param('id').isUUID().withMessage('Invalid trainer ID format'),
  handleValidationErrors,
];

// Deactivate trainer validator
const validateDeactivateTrainer = [
  param('id').isUUID().withMessage('Invalid trainer ID format'),
  handleValidationErrors,
];

// Reactivate trainer validator
const validateReactivateTrainer = [
  param('id').isUUID().withMessage('Invalid trainer ID format'),
  handleValidationErrors,
];

// ----------------- BOOKING VALIDATORS ------------------
// Create booking validator
const validateCreateBooking = [
  body('member_profile_id')
    .notEmpty()
    .withMessage('member_profile_id is required')
    .isUUID()
    .withMessage('member_profile_id must be a valid UUID'),
  body('class_id')
    .notEmpty()
    .withMessage('class_id is required')
    .isUUID()
    .withMessage('class_id must be a valid UUID'),
  handleValidationErrors,
];

// Cancel booking validator
const validateCancelBooking = [
  param('id').isUUID().withMessage('Invalid booking ID format'),
  handleValidationErrors,
];

// Reschedule booking validator
const validateRescheduleBooking = [
  param('id').isUUID().withMessage('Invalid booking ID format'),
  body('new_class_id')
    .notEmpty()
    .withMessage('new_class_id is required')
    .isUUID()
    .withMessage('new_class_id must be a valid UUID'),
  handleValidationErrors,
];

// Get bookings by member validator
const validateGetBookingsByMember = [
  param('memberProfileId')
    .isUUID()
    .withMessage('Invalid member profile ID format'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

// Get booking by ID validator
const validateGetBookingById = [
  param('id').isUUID().withMessage('Invalid booking ID format'),
  handleValidationErrors,
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,

  validateGetMemberById,
  validateGetMemberByUserId,
  validateGetMemberByUniqueId,
  validateUpdateMember,
  validateDeactivateUser,

  validateCreateClass,
  validateUpdateClass,

  validateCheckInHistory,
  validateCheckInMember,
  validateOverrideCheckIn,

  validateGetTrainerById,
  validateUpdateTrainer,
  validateGetTrainerSchedule,
  validateGetTrainerRoster,
  validateClassRoster,
  // validateAssignPlan,
  validatePersonalTrainingAttendance,
  validateGetClientFeedback,
  validateDeactivateTrainer,
  validateReactivateTrainer,

  validateCreateBooking,
  validateCancelBooking,
  validateRescheduleBooking,
  validateGetBookingsByMember,
  validateGetBookingById,
};
