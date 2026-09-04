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

const validateGetAllTrainers = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
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

// Validate trainer ID param (for fetching templates/meal plans)
const validateTrainerIdParam = [
  param('trainerId').isUUID().withMessage('Invalid trainer ID format'),
  handleValidationErrors,
];

// Assign workout / meal plan
const validateAssignPlan = [
  param('trainerId').isUUID().withMessage('Invalid trainer ID format'),
  body('member_profile_id')
    .notEmpty()
    .withMessage('member_profile_id is required')
    .isUUID()
    .withMessage('member_profile_id must be a valid UUID'),
  body('workout_template_id')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('workout_template_id must be a valid MongoDB ObjectId'),
  body('meal_plan_id')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('meal_plan_id must be a valid MongoDB ObjectId'),
  body('notes').optional().isString().withMessage('notes must be a string'),
  handleValidationErrors,
];

// Validate assign trainer (no plans)
const validateAssignTrainerToMember = [
  param('trainerId').isUUID().withMessage('Invalid trainer ID format'),
  body('member_profile_id')
    .notEmpty()
    .withMessage('member_profile_id is required')
    .isUUID()
    .withMessage('member_profile_id must be a valid UUID'),
  body('notes').optional().isString().withMessage('notes must be a string'),
  handleValidationErrors,
];

// Validate unassign trainer
const validateUnassignTrainer = [
  param('memberProfileId')
    .notEmpty()
    .withMessage('memberProfileId is required')
    .isUUID()
    .withMessage('Invalid member profile ID format'),
  handleValidationErrors,
];

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

// ----------------- HEALTH VALIDATORS ------------------
// Save health metric validator
const validateSaveHealthMetric = [
  body('member_id')
    .notEmpty()
    .withMessage('member_id is required')
    .isUUID()
    .withMessage('member_id must be a valid UUID'),
  body('weight_kg')
    .notEmpty()
    .withMessage('weight_kg is required')
    .isFloat({ min: 0 })
    .withMessage('weight_kg must be a positive number'),
  body('height_cm')
    .notEmpty()
    .withMessage('height_cm is required')
    .isFloat({ min: 0 })
    .withMessage('height_cm must be a positive number'),
  body('blood_type')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood type'),
  body('dietary_restrictions')
    .optional()
    .isString()
    .withMessage('dietary_restrictions must be a string'),
  body('body_fat_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('body_fat_percentage must be between 0 and 100'),
  body('muscle_mass_kg')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('muscle_mass_kg must be a positive number'),
  body('waist_cm')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('waist_cm must be a positive number'),
  body('notes').optional().isString().withMessage('notes must be a string'),
  handleValidationErrors,
];

// Get health metrics history validator
const validateGetHealthHistory = [
  param('memberId').isUUID().withMessage('Invalid member ID format'),
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

// Get latest health metric validator
const validateGetLatestHealthMetric = [
  param('memberId').isUUID().withMessage('Invalid member ID format'),
  handleValidationErrors,
];

// Get health metrics by date range validator
const validateGetHealthByDateRange = [
  param('memberId').isUUID().withMessage('Invalid member ID format'),
  query('startDate')
    .notEmpty()
    .withMessage('startDate is required')
    .isISO8601()
    .withMessage('startDate must be a valid date (YYYY-MM-DD)'),
  query('endDate')
    .notEmpty()
    .withMessage('endDate is required')
    .isISO8601()
    .withMessage('endDate must be a valid date (YYYY-MM-DD)'),
  handleValidationErrors,
];

// Delete health metric validator
const validateDeleteHealthMetric = [
  param('id').isMongoId().withMessage('Invalid health metric ID format'),
  handleValidationErrors,
];

// ----------------- TEMPLATE VALIDATORS ------------------
// ---------- Workout Template Validators ----------
// Create workout template validator
const validateCreateWorkoutTemplate = [
  body('trainer_id')
    .notEmpty()
    .withMessage('trainer_id is required')
    .isUUID()
    .withMessage('trainer_id must be a valid UUID'),
  body('name')
    .notEmpty()
    .withMessage('name is required')
    .isString()
    .withMessage('name must be a string'),
  body('description')
    .optional()
    .isString()
    .withMessage('description must be a string'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  body('goal_type')
    .optional()
    .isIn(['weight_loss', 'muscle_building', 'endurance', 'general_fitness'])
    .withMessage('Invalid goal type'),
  body('duration_weeks')
    .optional()
    .isInt({ min: 1 })
    .withMessage('duration_weeks must be a positive integer'),
  body('is_public')
    .optional()
    .isBoolean()
    .withMessage('is_public must be a boolean'),
  body('exercises')
    .optional()
    .isArray()
    .withMessage('exercises must be an array'),
  body('exercises.*.day_number')
    .if(body('exercises').exists())
    .notEmpty()
    .withMessage('day_number is required for each exercise')
    .isInt({ min: 1 })
    .withMessage('day_number must be a positive integer'),
  body('exercises.*.exercise_name')
    .if(body('exercises').exists())
    .notEmpty()
    .withMessage('exercise_name is required for each exercise')
    .isString()
    .withMessage('exercise_name must be a string'),
  body('exercises.*.sets')
    .optional()
    .isInt({ min: 0 })
    .withMessage('sets must be a non-negative integer'),
  body('exercises.*.reps_per_set')
    .optional()
    .isInt({ min: 0 })
    .withMessage('reps_per_set must be a non-negative integer'),
  body('exercises.*.weight_kg')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('weight_kg must be a non-negative number'),
  body('exercises.*.rest_seconds')
    .optional()
    .isInt({ min: 0 })
    .withMessage('rest_seconds must be a non-negative integer'),
  body('exercises.*.notes')
    .optional()
    .isString()
    .withMessage('notes must be a string'),

  handleValidationErrors,
];

// Get workout template by id validator
const validateGetWorkoutTemplateById = [
  param('id')
    .notEmpty()
    .withMessage('workout template id is required')
    .isUUID()
    .withMessage('workout template id must be a valid uuid'),
];

// Get workout templates validator
const validateGetWorkoutTemplates = [
  query('trainer_id')
    .optional()
    .isUUID()
    .withMessage('trainer_id must be a valid UUID'),
  query('goal_type')
    .optional()
    .isIn(['weight_loss', 'muscle_building', 'endurance', 'general_fitness'])
    .withMessage('Invalid goal type'),
  query('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  query('include_public')
    .optional()
    .isBoolean()
    .withMessage('is_public must be a boolean'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Update workout template validator
const validateUpdateWorkoutTemplate = [
  param('id').isMongoId().withMessage('Invalid workout template ID format'),
  body('name').optional().isString().withMessage('name must be a string'),
  body('description')
    .optional()
    .isString()
    .withMessage('description must be a string'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  body('goal_type')
    .optional()
    .isIn(['weight_loss', 'muscle_building', 'endurance', 'general_fitness'])
    .withMessage('Invalid goal type'),
  body('duration_weeks')
    .optional()
    .isInt({ min: 1 })
    .withMessage('duration_weeks must be a positive integer'),
  body('is_public')
    .optional()
    .isBoolean()
    .withMessage('is_public must be a boolean'),
  body('exercises')
    .optional()
    .isArray()
    .withMessage('exercises must be an array'),
  body('exercises.*.day_number')
    .if(body('exercises').exists())
    .notEmpty()
    .withMessage('day_number is required for each exercise')
    .isInt({ min: 1 })
    .withMessage('day_number must be a positive integer'),
  body('exercises.*.exercise_name')
    .if(body('exercises').exists())
    .notEmpty()
    .withMessage('exercise_name is required for each exercise')
    .isString()
    .withMessage('exercise_name must be a string'),
  body('exercises.*.sets')
    .optional()
    .isInt({ min: 0 })
    .withMessage('sets must be a non-negative integer'),
  body('exercises.*.reps_per_set')
    .optional()
    .isInt({ min: 0 })
    .withMessage('reps_per_set must be a non-negative integer'),
  body('exercises.*.weight_kg')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('weight_kg must be a non-negative number'),
  body('exercises.*.rest_seconds')
    .optional()
    .isInt({ min: 0 })
    .withMessage('rest_seconds must be a non-negative integer'),
  body('exercises.*.notes')
    .optional()
    .isString()
    .withMessage('notes must be a string'),
  handleValidationErrors,
];

// Delete workout template validator
const validateDeleteWorkoutTemplate = [
  param('id')
    .notEmpty()
    .withMessage('workout template id is required')
    .isUUID()
    .withMessage('workout template id must be a valid uuid'),
];

// ---------- Meal Plan Validators ----------
// Create meal plan validator
const validateCreateMealPlan = [
  body('trainer_id')
    .notEmpty()
    .withMessage('trainer_id is required')
    .isUUID()
    .withMessage('trainer_id must be a valid UUID'),
  body('name')
    .notEmpty()
    .withMessage('name is required')
    .isString()
    .withMessage('name must be a string'),
  body('description')
    .optional()
    .isString()
    .withMessage('description must be a string'),
  body('goal_type')
    .optional()
    .isIn(['weight_loss', 'muscle_building', 'maintenance'])
    .withMessage('Invalid goal type'),
  body('calories_target')
    .optional()
    .isInt({ min: 0 })
    .withMessage('calories_target must be a non-negative integer'),
  body('protein_g')
    .optional()
    .isInt({ min: 0 })
    .withMessage('protein_g must be a non-negative integer'),
  body('carbs_g')
    .optional()
    .isInt({ min: 0 })
    .withMessage('carbs_g must be a non-negative integer'),
  body('fat_g')
    .optional()
    .isInt({ min: 0 })
    .withMessage('fat_g must be a non-negative integer'),
  body('items').optional().isArray().withMessage('items must be an array'),
  body('items.*.day_number')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('day_number is required for each item')
    .isInt({ min: 1 })
    .withMessage('day_number must be a positive integer'),
  body('items.*.meal_name')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('meal_name is required for each item')
    .isIn(['Breakfast', 'Lunch', 'Dinner', 'Snack'])
    .withMessage('meal_name must be one of: Breakfast, Lunch, Dinner, Snack'),
  body('items.*.food_item')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('food_item is required for each item')
    .isString()
    .withMessage('food_item must be a string'),
  body('items.*.quantity')
    .optional()
    .isString()
    .withMessage('quantity must be a string'),
  body('items.*.calories')
    .optional()
    .isInt({ min: 0 })
    .withMessage('calories must be a non-negative integer'),
  body('items.*.protein_g')
    .optional()
    .isInt({ min: 0 })
    .withMessage('protein_g must be a non-negative integer'),
  body('items.*.carbs_g')
    .optional()
    .isInt({ min: 0 })
    .withMessage('carbs_g must be a non-negative integer'),
  body('items.*.fat_g')
    .optional()
    .isInt({ min: 0 })
    .withMessage('fat_g must be a non-negative integer'),
  handleValidationErrors,
];

// Update meal plan validator
const validateUpdateMealPlan = [
  param('id').isMongoId().withMessage('Invalid meal plan ID format'),
  body('name').optional().isString().withMessage('name must be a string'),
  body('description')
    .optional()
    .isString()
    .withMessage('description must be a string'),
  body('goal_type')
    .optional()
    .isIn(['weight_loss', 'muscle_building', 'maintenance'])
    .withMessage('Invalid goal type'),
  body('calories_target')
    .optional()
    .isInt({ min: 0 })
    .withMessage('calories_target must be a non-negative integer'),
  body('protein_g')
    .optional()
    .isInt({ min: 0 })
    .withMessage('protein_g must be a non-negative integer'),
  body('carbs_g')
    .optional()
    .isInt({ min: 0 })
    .withMessage('carbs_g must be a non-negative integer'),
  body('fat_g')
    .optional()
    .isInt({ min: 0 })
    .withMessage('fat_g must be a non-negative integer'),
  body('items').optional().isArray().withMessage('items must be an array'),
  body('items.*.day_number')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('day_number is required for each item')
    .isInt({ min: 1 })
    .withMessage('day_number must be a positive integer'),
  body('items.*.meal_name')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('meal_name is required for each item')
    .isIn(['Breakfast', 'Lunch', 'Dinner', 'Snack'])
    .withMessage('meal_name must be one of: Breakfast, Lunch, Dinner, Snack'),
  body('items.*.food_item')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('food_item is required for each item')
    .isString()
    .withMessage('food_item must be a string'),
  body('items.*.quantity')
    .optional()
    .isString()
    .withMessage('quantity must be a string'),
  body('items.*.calories')
    .optional()
    .isInt({ min: 0 })
    .withMessage('calories must be a non-negative integer'),
  body('items.*.protein_g')
    .optional()
    .isInt({ min: 0 })
    .withMessage('protein_g must be a non-negative integer'),
  body('items.*.carbs_g')
    .optional()
    .isInt({ min: 0 })
    .withMessage('carbs_g must be a non-negative integer'),
  body('items.*.fat_g')
    .optional()
    .isInt({ min: 0 })
    .withMessage('fat_g must be a non-negative integer'),
  handleValidationErrors,
];

// Get meal plan by id validator
const validateGetMealPlanById = [
  param('id')
    .notEmpty()
    .withMessage('workout template id is required')
    .isUUID()
    .withMessage('workout template id must be a valid uuid'),
];

// Delete meal plan validator
const validateDeleteMealPlan = [
  param('id')
    .notEmpty()
    .withMessage('workout template id is required')
    .isUUID()
    .withMessage('workout template id must be a valid uuid'),
];

// Get meal plans validator
const validateGetMealPlans = [
  query('trainer_id')
    .optional()
    .isUUID()
    .withMessage('trainer_id must be a valid UUID'),
  query('goal_type')
    .optional()
    .isIn(['weight_loss', 'muscle_building', 'maintenance'])
    .withMessage('Invalid goal type'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// ---------- NOTIFICATION VALIDATORS ----------

// Get my notifications validator
const validateGetNotifications = [
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

// Mark notification as read validator
const validateMarkAsRead = [
  param('id').isMongoId().withMessage('Invalid notification ID format'),
  handleValidationErrors,
];

// Delete notification validator
const validateDeleteNotification = [
  param('id').isMongoId().withMessage('Invalid notification ID format'),
  handleValidationErrors,
];

// Get user notifications (admin) validator
const validateGetUserNotifications = [
  param('userId').isUUID().withMessage('Invalid user ID format'),
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

// Cleanup notifications validator
const validateCleanup = [
  query('days')
    .optional()
    .isInt({ min: 1 })
    .withMessage('days must be a positive integer'),
  handleValidationErrors,
];

// ---------- PROGRESS VALIDATORS ----------

// Log progress validator
const validateLogProgress = [
  body('member_assignment_id')
    .notEmpty()
    .withMessage('member_assignment_id is required')
    .isUUID()
    .withMessage('member_assignment_id must be a valid UUID'),
  body('weight_kg')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('weight_kg must be a positive number'),
  body('body_fat_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('body_fat_percentage must be between 0 and 100'),
  body('muscle_mass_kg')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('muscle_mass_kg must be a positive number'),
  body('notes').optional().isString().withMessage('notes must be a string'),
  handleValidationErrors,
];

// Get progress history validator
const validateGetProgressHistory = [
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

const validateGetLatestProgress = [
  param('memberProfileId')
    .isUUID()
    .withMessage('Invalid member profile ID format'),
];

// Delete progress log validator
const validateDeleteProgressLog = [
  param('id').isUUID().withMessage('Invalid progress log ID format'),
  handleValidationErrors,
];

// ---------- RATING VALIDATORS ----------

// Submit rating validator
const validateSubmitRating = [
  param('type')
    .isIn(['trainer', 'facility', 'class'])
    .withMessage('Invalid rating type. Must be trainer, facility, or class'),
  body('rating_stars')
    .notEmpty()
    .withMessage('rating_stars is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('rating_stars must be between 1 and 5'),
  body('trainer_id')
    .if(param('type').equals('trainer'))
    .notEmpty()
    .withMessage('trainer_id is required for trainer rating')
    .isUUID()
    .withMessage('trainer_id must be a valid UUID'),
  body('class_id')
    .if(param('type').equals('class'))
    .notEmpty()
    .withMessage('class_id is required for class rating')
    .isUUID()
    .withMessage('class_id must be a valid UUID'),
  body('rating_dimension')
    .optional()
    .isString()
    .withMessage('rating_dimension must be a string'),
  body('comment').optional().isString().withMessage('comment must be a string'),
  body('is_anonymous')
    .optional()
    .isBoolean()
    .withMessage('is_anonymous must be a boolean'),
  handleValidationErrors,
];

// Get trainer rating validator
const validateGetTrainerRating = [
  param('trainerId').isUUID().withMessage('Invalid trainer ID format'),
  handleValidationErrors,
];

// Get flagged rating validator
const validateGetFlaggedRating = [
  query('threshold')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('threshold must be between 1 and 5'),
  handleValidationErrors,
];

// Moderate rating validator
const validateModerateRating = [
  param('id').isUUID().withMessage('Invalid rating ID format'),
  body('moderation_notes')
    .notEmpty()
    .withMessage('moderation_notes is required')
    .isString()
    .withMessage('moderation_notes must be a string'),
  handleValidationErrors,
];

// ---------- PAYMENT VALIDATORS ----------

//  Validate payment initiation request
const validateInitPayment = [
  body('member_profile_id')
    .notEmpty()
    .withMessage('member_profile_id is required')
    .isUUID()
    .withMessage('member_profile_id must be a valid UUID'),
  body('membership_tier_id')
    .notEmpty()
    .withMessage('membership_tier_id is required')
    .isUUID()
    .withMessage('membership_tier_id must be a valid UUID'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('start_date must be a valid date (YYYY-MM-DD)'),
  body('auto_renew')
    .optional()
    .isBoolean()
    .withMessage('auto_renew must be a boolean'),
  handleValidationErrors,
];

// Validate payment verification request
const validateVerifyPayment = [
  param('orderId')
    .notEmpty()
    .withMessage('orderId is required')
    .isString()
    .withMessage('orderId must be a string'),
  handleValidationErrors,
];

// ---------- SUBSCRIPTION VALIDATORS ----------

// Create subscription validator
const validateCreateSubscription = [
  body('member_profile_id')
    .notEmpty()
    .withMessage('member_profile_id is required')
    .isUUID()
    .withMessage('member_profile_id must be a valid UUID'),
  body('membership_tier_id')
    .notEmpty()
    .withMessage('membership_tier_id is required')
    .isUUID()
    .withMessage('membership_tier_id must be a valid UUID'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('start_date must be a valid date (YYYY-MM-DD)'),
  body('auto_renew')
    .optional()
    .isBoolean()
    .withMessage('auto_renew must be a boolean'),
  handleValidationErrors,
];

// Update subscription status validator
const validateUpdateSubscriptionStatus = [
  param('id').isUUID().withMessage('Invalid subscription ID format'),
  body('status')
    .notEmpty()
    .withMessage('status is required')
    .isIn(['active', 'frozen', 'expired', 'cancelled'])
    .withMessage('Invalid status. Must be: active, frozen, expired, cancelled'),
  handleValidationErrors,
];

// Get active subscription validator
const validateGetActiveSubscription = [
  param('memberProfileId')
    .isUUID()
    .withMessage('Invalid member profile ID format'),
  handleValidationErrors,
];

// Get subscription by ID validator
const validateGetSubscriptionById = [
  param('id').isUUID().withMessage('Invalid subscription ID format'),
  handleValidationErrors,
];

// Get subscriptions by member validator
const validateGetSubscriptionsByMember = [
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
  validateGetAllTrainers,
  validateGetTrainerSchedule,
  validateGetTrainerRoster,
  validateClassRoster,
  validateTrainerIdParam,
  validateAssignPlan,
  validateAssignTrainerToMember,
  validateUnassignTrainer,
  validatePersonalTrainingAttendance,
  validateGetClientFeedback,
  validateDeactivateTrainer,
  validateReactivateTrainer,

  validateCreateBooking,
  validateCancelBooking,
  validateRescheduleBooking,
  validateGetBookingsByMember,
  validateGetBookingById,

  validateSaveHealthMetric,
  validateGetHealthHistory,
  validateGetLatestHealthMetric,
  validateGetHealthByDateRange,
  validateDeleteHealthMetric,

  validateCreateWorkoutTemplate,
  validateUpdateWorkoutTemplate,
  validateGetWorkoutTemplateById,
  validateGetWorkoutTemplates,
  validateDeleteWorkoutTemplate,
  validateCreateMealPlan,
  validateUpdateMealPlan,
  validateGetMealPlans,
  validateGetMealPlanById,
  validateDeleteMealPlan,

  validateGetNotifications,
  validateMarkAsRead,
  validateDeleteNotification,
  validateGetUserNotifications,
  validateCleanup,

  validateLogProgress,
  validateGetProgressHistory,
  validateGetLatestProgress,
  validateDeleteProgressLog,

  validateSubmitRating,
  validateModerateRating,
  validateGetFlaggedRating,
  validateGetTrainerRating,

  validateInitPayment,
  validateVerifyPayment,

  validateCreateSubscription,
  validateUpdateSubscriptionStatus,
  validateGetActiveSubscription,
  validateGetSubscriptionById,
  validateGetSubscriptionsByMember,
};
