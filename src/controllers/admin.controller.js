const { registerUser } = require('../services/auth.service');
const { sendError, sendSuccess, ErrorCodes } = require('../utils/response');

const adminRegister = async (req, res, next) => {
  try {
    const payload = req.body;

    if (
      !payload.email ||
      !payload.password ||
      !payload.first_name ||
      !payload.last_name
    ) {
      return sendError(
        res,
        'Email, password, first_name, and last_name are required',
        ErrorCodes.VALIDATION_ERROR,
        400,
      );
    }

    // Ensure role is provided (admin must specify it)
    if (!payload.role) {
      return sendError(
        res,
        'Role is required. Must be: member, trainer or reception',
        ErrorCodes.VALIDATION_ERROR,
        400,
      );
    }

    const validRoles = ['member', 'trainer', 'reception'];
    if (!validRoles.includes(payload.role)) {
      return sendError(
        res,
        `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        ErrorCodes.VALIDATION_ERROR,
        400,
      );
    }

    const result = await registerUser(payload);

    // Add admin note to response
    result.message = `[Admin] ${result.message}`;

    return sendSuccess(res, result, result.message, 201);
  } catch (error) {
    if (error.message === 'Email already registered') {
      return sendError(res, error.message, ErrorCodes.CONFLICT, 409);
    }
    if (error.message.startsWith('Invalid role')) {
      return sendError(res, error.message, ErrorCodes.VALIDATION_ERROR, 400);
    }
    next(error);
  }
};

module.exports = {
  adminRegister,
};
