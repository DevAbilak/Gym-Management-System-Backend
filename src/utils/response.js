/**
 * Ensures consistent response format across all endpoints.
 * Success: { success: true, data: ..., message: ... }
 * Error: { success: false, error: '...', code: '...' }
 */

const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

const sendError = (
  res,
  error,
  code = 'INTERNAL_ERROR',
  statusCode = 500,
  details = null,
) => {
  const message =
    typeof error === 'string'
      ? error
      : error.message || 'Internal Server Error';
  const errorCode = error.code || code;

  const response = {
    success: false,
    error: message,
    code: errorCode,
  };

  // Include details if provided
  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

// Pre-defined error codes
const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  REFRESH_TOKEN_EXPIRED: 'REFRESH_TOKEN_EXPIRED',
  REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',
  REFRESH_TOKEN_REVOKED: 'REFRESH_TOKEN_REVOKED',
};

module.exports = {
  sendSuccess,
  sendError,
  ErrorCodes,
};
