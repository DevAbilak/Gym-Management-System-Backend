/**
 * Auth API Documentation (OpenAPI)
 *
 * All auth-related endpoints, request bodies, and responses.
 */
const authPaths = {
  '/auth/register': {
    post: {
      summary: 'Public Registration - Register as Member or Trainer',
      description: `Creates a user account and automatically creates the associated profile based on the role.
        - **member**: Creates a member profile with a unique gym ID.
        - **trainer**: Creates a trainer profile.
        
        ⚠️ **Public users can only register as 'member' or 'trainer'.** 
        For admin or reception accounts, please contact an administrator.`,
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/PublicRegistrationRequest',
            },
            example: {
              email: 'alex@gmail.com',
              password: 'SecurePass123!',
              first_name: 'Alex',
              last_name: 'Asfaw',
              phone: '+251 9 12 10-28 34',
              role: 'member',
              date_of_birth: '1996-01-01',
              gender: 'male',
              blood_type: 'O+',
              dietary_restrictions: 'Gluten-Free',
              fitness_goal: 'muscle_building',
              emergency_contact_name: 'Yared Alemu',
              emergency_contact_phone: '0912234543',
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
                ],
              },
            },
          },
        },
        400: {
          description:
            'Email already registered, validation error, or missing required fields',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    examples: [
                      'Email already registered',
                      'Invalid role: admin',
                      'Email, password, first_name, and last_name are required',
                    ],
                  },
                },
              },
            },
          },
        },
        403: {
          description:
            'Attempted to register with disallowed role (admin/reception)',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example:
                      'Public registration only allows: member, trainer.',
                  },
                },
              },
            },
          },
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
            example: {
              email: 'john.doe@example.com',
              password: 'SecurePass123!',
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
        400: {
          description: 'Email and password are required',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Email and password are required',
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Authentication failed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    examples: [
                      'User does not exist.Please register',
                      'Account is deactivated',
                      'Invalid password',
                    ],
                  },
                },
              },
            },
          },
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
              $ref: '#/components/schemas/RefreshTokenRequest',
            },
            example: {
              refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
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
        400: {
          description: 'Refresh token required',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Refresh token required',
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Invalid or expired refresh token',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    examples: ['Invalid refresh token', 'User not found'],
                  },
                },
              },
            },
          },
        },
        500: {
          description: 'Server error',
        },
      },
    },
  },

  '/auth/logout': {
    get: {
      summary: 'Logout user',
      description:
        'Invalidates the user\'s refresh token in Redis. Requires Bearer token.',
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
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    examples: [
                      'Authorization token required. Please log in first.',
                      'Token expired. Please refresh your token or log in again.',
                      'Invalid token. Please log in again.',
                    ],
                  },
                },
              },
            },
          },
        },
        500: {
          description: 'Server error',
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
            example: {
              email: 'john.doe@example.com',
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
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Email is required',
                  },
                },
              },
            },
          },
        },
        500: {
          description: 'Unable to send reset email',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example:
                      'Unable to send reset email. Please try again later.',
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  '/auth/reset-password': {
    post: {
      summary: 'Reset password using token',
      description:
        'Resets the user\'s password using a valid reset token received via email.',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ResetPasswordRequest',
            },
            example: {
              email: 'john.doe@example.com',
              token: 'a1b2c3d4e5f67890...',
              newPassword: 'NewSecurePass123!',
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
          description: 'Invalid or expired token, or missing required fields',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    examples: [
                      'Email, token, and new password are required',
                      'Invalid or expired reset token',
                      'User does not exist.',
                    ],
                  },
                },
              },
            },
          },
        },
        500: {
          description: 'Server error',
        },
      },
    },
  },
};

const authSchemas = {
  // ---------- PUBLIC REGISTRATION (Restricted to Member & Trainer) ----------
  PublicRegistrationRequest: {
    type: 'object',
    required: [
      'email',
      'password',
      'first_name',
      'last_name',
      'role',
      'date_of_birth',
      'gender',
      'fitness_goal',
      'emergency_contact_name',
      'emergency_contact_phone',
    ],
    properties: {
      // ---- Common fields ----
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
        enum: ['member', 'trainer'],
        description: 'Public registration only allows member or trainer roles.',
        example: 'member',
      },
      // ---- Member fields ----
      date_of_birth: { type: 'string', format: 'date', example: '1996-01-01' },
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
      // ---- Trainer fields ----
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
  PublicBaseRegistration: {
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
        enum: ['member', 'trainer'],
        description: 'Public registration only allows member or trainer roles.',
        example: 'member',
      },
    },
  },

  PublicMemberRegistration: {
    allOf: [
      { $ref: '#/components/schemas/PublicBaseRegistration' },
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

  PublicTrainerRegistration: {
    allOf: [
      { $ref: '#/components/schemas/PublicBaseRegistration' },
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

  // ---------- ADMIN REGISTRATION (Full access - documented in admin.docs.js) ----------
  AdminRegistrationRequest: {
    type: 'object',
    required: ['email', 'password', 'first_name', 'last_name', 'role'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'reception@fitaddis.com',
      },
      password: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'SecurePass123!',
      },
      first_name: { type: 'string', example: 'Sarah' },
      last_name: { type: 'string', example: 'Johnson' },
      phone: { type: 'string', example: '+251 9 11 22-33-44' },
      role: {
        type: 'string',
        enum: ['member', 'trainer', 'admin', 'reception'],
        description: 'Admin can assign any role',
        example: 'reception',
      },
    },
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
        example: 'a1b2c3d4e5f67890...',
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
