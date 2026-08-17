const { body, validationResult, param } = require("express-validator");
const { sendError, ErrorCodes } = require("../utils/response");

// Helper: handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(
      res,
      "Validation failed",
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
  body("email")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("first_name")
    .notEmpty()
    .withMessage("First name is required")
    .isString()
    .withMessage("First name must be string"),
  body("last_name")
    .notEmpty()
    .withMessage("Last name is required")
    .isString()
    .withMessage("Last name must be a string"),
  body("phone").optional().isString().withMessage("Phone must be string"),
  body("role")
    .optional()
    .isIn(["member", "trainer"])
    .withMessage("Public registration only allows: member, trainer"),

  // member specific fields (if role === "member")
  body("date_of_birth")
    .if(body("role").equals("member"))
    .notEmpty()
    .withMessage("Date of birth is required for members")
    .isISO8601()
    .withMessage("Date of birth must be 'a valid date (YYYY-MM-DD)"),
  body("gender")
    .if(body("role").equals("member"))
    .notEmpty()
    .withMessage("Gender is required for members")
    .isIn(["male", "female"])
    .withMessage('Gender must be "male" or "female"'),
  body("fitness_goal")
    .if(body("role").equals("member"))
    .notEmpty()
    .withMessage("Fitness goal is required for members")
    .isIn(["weight_loss", "muscle_building", "maintenance", "general_fitness"])
    .withMessage("Invalid fitness goal"),
  body("emergency_contact_name")
    .if(body("role").equals("member"))
    .notEmpty()
    .withMessage("Emergency contact name is required for members"),
  body("emergency_contact_phone")
    .if(body("role").equals("member"))
    .notEmpty()
    .withMessage("Emergency contact phone is required for members"),
  body("blood_type")
    .optional()
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Invalid blood type"),
  body("dietary_restrictions")
    .optional()
    .isString()
    .withMessage("Dietary restrictions must be a string"),

  // Trainer specific fields (if role === "trainer")
  body("specialty")
    .if(body("role").equals("trainer"))
    .notEmpty()
    .withMessage("Specialty is required for trainers"),
  body("years_of_experience")
    .if(body("role").equals("trainer"))
    .notEmpty()
    .withMessage("Years of experience is required for trainers")
    .isInt({ min: 0 })
    .withMessage("Years of experience must be a positive integer"),
  body("certification")
    .if(body("role").equals("trainer"))
    .notEmpty()
    .withMessage("Certification is required for trainers"),
  body("hourly_rate")
    .if(body("role").equals("trainer"))
    .notEmpty()
    .withMessage("Hourly rate is required for trainers")
    .isFloat({ min: 0 })
    .withMessage("Hourly rate must be a positive number"),
  body("bio").optional().isString().withMessage("Bio must be a string"),

  handleValidationErrors,
];

// Login validator
const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

// Forgot password validator
const validateForgotPassword = [
  body("email")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),

  handleValidationErrors,
];

// Reset password validator
const validateResetPassword = [
  body("email")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("token")
    .notEmpty()
    .withMessage("Reset token is required")
    .isString()
    .withMessage("Reset token must be a string"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long"),

  handleValidationErrors,
];

// ----------------- CLASS VALIDATORS ------------------
// create class validator
const validateCreateClass = [
  body("trainer_id")
    .notEmpty()
    .withMessage("trainer_id is required")
    .isUUID()
    .withMessage("trainer_id must be a valid UUID"),
  body("name")
    .notEmpty()
    .withMessage("Class name is required")
    .isString()
    .withMessage("Class name must be a string"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
  body("category")
    .optional()
    .isIn(["yoga", "pilates", "hiit", "spin", "strength", "dance", "other"])
    .withMessage("Invalid category"),
  body("difficulty")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Invalid difficulty level"),
  body("capacity")
    .notEmpty()
    .withMessage("Capacity is required")
    .isInt({ min: 1 })
    .withMessage("Capacity must be at least 1"),
  body("start_time")
    .notEmpty()
    .withMessage("start_time is required")
    .isISO8601()
    .withMessage("start_time must be a valid ISO datetime"),
  body("end_time")
    .notEmpty()
    .withMessage("end_time is required")
    .isISO8601()
    .withMessage("end_time must be a valid ISO datetime"),
  body("location")
    .optional()
    .isString()
    .withMessage("Location must be a string"),

  handleValidationErrors,
];

// update class validator
const validateUpdateClass = [
  param("id").isUUID().withMessage("Invalid class ID format"),
  body("name").optional().isString().withMessage("Name must be a string"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
  body("category")
    .optional()
    .isIn(["yoga", "pilates", "hiit", "spin", "strength", "dance", "other"])
    .withMessage("Invalid category"),
  body("difficulty")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Invalid difficulty level"),
  body("capacity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Capacity must be at least 1"),
  body("start_time")
    .optional()
    .isISO8601()
    .withMessage("start_time must be a valid ISO datetime"),
  body("end_time")
    .optional()
    .isISO8601()
    .withMessage("end_time must be a valid ISO datetime"),
  body("location")
    .optional()
    .isString()
    .withMessage("Location must be a string"),
  body("status")
    .optional()
    .isIn(["scheduled", "cancelled", "completed"])
    .withMessage("Invalid status"),

  handleValidationErrors,
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateCreateClass,
  validateUpdateClass,
};
