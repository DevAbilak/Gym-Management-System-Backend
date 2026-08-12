/**
 * Auth API Documentation (OpenAPI)
 *
 * All auth-related endpoints, request bodies, and responses.
 */
const authPaths = {
  '/auth/register': {
    post: {
      summary: 'Register a new user account',
      description: 'Creates a new user account with email, password, and role.',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RegisterRequest',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'User successfully registered',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RegisterResponse',
              },
            },
          },
        },
        400: {
          description: 'Email already registered or validation error',
        },
        500: {
          description: 'Server error',
        },
      },
    },
  },

  '/auth/login': {
    post: {
      summary: 'Authenticate user and get tokens',
      description: 'Logs in a user and returns JWT access and refresh tokens.',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/LoginRequest',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successful login',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginResponse',
              },
            },
          },
        },
        401: {
          description: 'Invalid credentials or account deactivated',
        },
        500: {
          description: 'Server error',
        },
      },
    },
  },

  '/auth/refresh': {
    post: {
      summary: 'Refresh access token',
      description: 'Obtain a new access token using a valid refresh token.',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refreshToken'],
              properties: {
                refreshToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'New access token generated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  accessToken: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Invalid or expired refresh token',
        },
      },
    },
  },

  '/auth/logout': {
    post: {
      summary: 'Logout user',
      description:
        'Invalidates the user\'s refresh token. Requires Bearer token.',
      tags: ['Authentication'],
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Successfully logged out',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Logged out successfully',
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Unauthorized (missing or invalid token)',
        },
      },
    },
  },

  '/auth/forgot-password': {
    post: {
      summary: 'Request password reset',
      description:
        'Sends a password reset link to the user\'s email (via Brevo).',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'john.doe@example.com',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description:
            'Reset link sent (or email not found — generic message for security)',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'If the email exists, a reset link will be sent',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Email is required',
        },
        500: {
          description: 'Server error',
        },
      },
    },
  },

  '/auth/reset-password': {
    post: {
      summary: 'Reset password using token',
      description: 'Resets the user\'s password using a valid reset token.',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ResetPasswordRequest',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Password updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Password updated successfully',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Invalid or expired token, or email required',
        },
        500: {
          description: 'Server error',
        },
      },
    },
  },
};

const authSchemas = {
  RegisterRequest: {
    type: 'object',
    required: ['email', 'password', 'first_name', 'last_name'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'john.doe@example.com',
      },
      password: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'SecurePass123!',
      },
      first_name: {
        type: 'string',
        example: 'John',
      },
      last_name: {
        type: 'string',
        example: 'Doe',
      },
      phone: {
        type: 'string',
        example: '+251911111111',
      },
      role: {
        type: 'string',
        enum: ['admin', 'trainer', 'member', 'reception'],
        default: 'member',
        example: 'member',
      },
    },
  },
  RegisterResponse: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440000',
      },
      email: {
        type: 'string',
        example: 'john.doe@example.com',
      },
      first_name: {
        type: 'string',
        example: 'John',
      },
      last_name: {
        type: 'string',
        example: 'Doe',
      },
      role: {
        type: 'string',
        example: 'member',
      },
    },
  },
  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'john.doe@example.com',
      },
      password: {
        type: 'string',
        format: 'password',
        example: 'SecurePass123!',
      },
    },
  },
  LoginResponse: {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          role: { type: 'string' },
        },
      },
      accessToken: {
        type: 'string',
        description: 'JWT access token (valid for 15 minutes)',
      },
      refreshToken: {
        type: 'string',
        description: 'JWT refresh token (valid for 7 days, stored in Redis)',
      },
    },
  },
  ResetPasswordRequest: {
    type: 'object',
    required: ['email', 'token', 'newPassword'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'john.doe@example.com',
      },
      token: {
        type: 'string',
        description: 'Reset token received via email',
        example: 'a1b2c3d4e5f6...',
      },
      newPassword: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'NewSecurePass123!',
      },
    },
  },
};

module.exports = { authPaths, authSchemas };
