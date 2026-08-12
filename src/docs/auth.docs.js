/**
 * Auth API Documentation (OpenAPI)
 *
 * All auth-related endpoints, request bodies, and responses.
 */
const authPaths = {
  '/auth/register': {
    post: {
      summary:
        'Unified Registration - Register as Member, Trainer, Admin, or Reception',
      description: `Creates a user account and automatically creates the associated profile based on the role.
        - **member**: Creates member_profiles record with unique ID.
        - **trainer**: Creates trainers record.
        - **admin/reception**: No additional profile required.`,
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              oneOf: [
                { $ref: '#/components/schemas/MemberRegistration' },
                { $ref: '#/components/schemas/TrainerRegistration' },
                { $ref: '#/components/schemas/AdminRegistration' },
                { $ref: '#/components/schemas/ReceptionRegistration' },
              ],
              discriminator: {
                propertyName: 'role',
                mapping: {
                  member: '#/components/schemas/MemberRegistration',
                  trainer: '#/components/schemas/TrainerRegistration',
                  admin: '#/components/schemas/AdminRegistration',
                  reception: '#/components/schemas/ReceptionRegistration',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Registration successful (role-specific response)',
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: '#/components/schemas/MemberRegistrationResponse' },
                  { $ref: '#/components/schemas/TrainerRegistrationResponse' },
                  { $ref: '#/components/schemas/UserRegistrationResponse' },
                ],
              },
            },
          },
        },
        400: {
          description:
            'Email already registered, invalid role, or validation error',
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
              $ref: '#/components/schemas/RefreshTokenRequest',
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
                $ref: '#/components/schemas/RefreshTokenResponse',
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
                $ref: '#/components/schemas/MessageResponse',
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
              $ref: '#/components/schemas/ForgotPasswordRequest',
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
                $ref: '#/components/schemas/MessageResponse',
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
                $ref: '#/components/schemas/MessageResponse',
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
  // ---------- BASE REQUEST (Shared fields) ----------
  BaseRegistration: {
    type: 'object',
    required: ['email', 'password', 'first_name', 'last_name', 'role'],
    properties: {
      email: { type: 'string', format: 'email', example: 'alex@gmail.com' },
      password: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'SecurePass123!',
      },
      first_name: { type: 'string', example: 'Alex' },
      last_name: { type: 'string', example: 'Asfaw' },
      phone: { type: 'string', example: '+251 9 12 10-28 34' },
      role: {
        type: 'string',
        enum: ['member', 'trainer', 'admin', 'reception'],
      },
    },
  },

  // ---------- ROLE-SPECIFIC REGISTRATION REQUESTS ----------
  MemberRegistration: {
    allOf: [
      { $ref: '#/components/schemas/BaseRegistration' },
      {
        type: 'object',
        required: [
          'role',
          'date_of_birth',
          'gender',
          'fitness_goal',
          'emergency_contact_name',
          'emergency_contact_phone',
        ],
        properties: {
          role: { type: 'string', enum: ['member'] },
          date_of_birth: {
            type: 'string',
            format: 'date',
            example: '1996-01-01',
          },
          gender: { type: 'string', enum: ['male', 'female'], example: 'male' },
          blood_type: {
            type: 'string',
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            example: 'O+',
          },
          dietary_restrictions: { type: 'string', example: 'Gluten-Free' },
          fitness_goal: {
            type: 'string',
            enum: [
              'weight_loss',
              'muscle_building',
              'maintenance',
              'general_fitness',
            ],
            example: 'muscle_building',
          },
          emergency_contact_name: { type: 'string', example: 'Yared Alemu' },
          emergency_contact_phone: { type: 'string', example: '0912234543' },
        },
      },
    ],
  },
  TrainerRegistration: {
    allOf: [
      { $ref: '#/components/schemas/BaseRegistration' },
      {
        type: 'object',
        required: [
          'role',
          'specialty',
          'years_of_experience',
          'certification',
          'hourly_rate',
        ],
        properties: {
          role: { type: 'string', enum: ['trainer'] },
          specialty: { type: 'string', example: 'HIIT & Strength Training' },
          years_of_experience: { type: 'integer', example: 5 },
          certification: { type: 'string', example: 'NSCA-CPT' },
          hourly_rate: { type: 'number', format: 'float', example: 45.0 },
          bio: {
            type: 'string',
            example: 'Certified trainer with 5+ years of experience...',
          },
        },
      },
    ],
  },
  AdminRegistration: {
    allOf: [
      { $ref: '#/components/schemas/BaseRegistration' },
      {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', enum: ['admin'] },
        },
      },
    ],
  },
  ReceptionRegistration: {
    allOf: [
      { $ref: '#/components/schemas/BaseRegistration' },
      {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', enum: ['reception'] },
        },
      },
    ],
  },

  // ---------- REGISTRATION RESPONSES ----------
  MemberRegistrationResponse: {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          unique_member_id: { type: 'string', example: 'GYM-A3F9-7' },
          date_of_birth: { type: 'string', format: 'date' },
          gender: { type: 'string' },
          blood_type: { type: 'string' },
          dietary_restrictions: { type: 'string' },
          fitness_goal: { type: 'string' },
          emergency_contact_name: { type: 'string' },
          emergency_contact_phone: { type: 'string' },
          email: { type: 'string' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          role: { type: 'string', example: 'member' },
        },
      },
      message: {
        type: 'string',
        example: 'Member registration complete! Welcome to FitAddis.',
      },
    },
  },
  TrainerRegistrationResponse: {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          specialty: { type: 'string' },
          years_of_experience: { type: 'integer' },
          certification: { type: 'string' },
          hourly_rate: { type: 'number' },
          bio: { type: 'string' },
          email: { type: 'string' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          role: { type: 'string', example: 'trainer' },
        },
      },
      message: {
        type: 'string',
        example: 'Trainer registration complete! Welcome to FitAddis.',
      },
    },
  },
  UserRegistrationResponse: {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          role: { type: 'string', example: 'admin' },
        },
      },
      message: {
        type: 'string',
        example: 'admin user registered successfully.',
      },
    },
  },

  // ---------- LOGIN ----------
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

  // ---------- REFRESH TOKEN ----------
  RefreshTokenRequest: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  },
  RefreshTokenResponse: {
    type: 'object',
    properties: {
      accessToken: { type: 'string' },
    },
  },

  // ---------- FORGOT / RESET PASSWORD ----------
  ForgotPasswordRequest: {
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

  // ---------- GENERIC MESSAGE RESPONSE ----------
  MessageResponse: {
    type: 'object',
    properties: {
      message: { type: 'string' },
    },
  },
};

module.exports = { authPaths, authSchemas };
