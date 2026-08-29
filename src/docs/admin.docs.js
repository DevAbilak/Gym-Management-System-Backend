/**
 * Admin API Documentation (OpenAPI)
 *
 * All admin-only endpoints.
 * All routes require authentication and admin role.
 */
const adminPaths = {
  // ============================================================
  // ADMIN: REGISTER USER
  // ============================================================
  '/admin/register': {
    post: {
      summary: 'Register any user (Admin only)',
      description:
        'Creates a user account with any role (member, trainer, reception). Admin only.',
      tags: ['Admin'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AdminRegistrationRequest',
            },
            example: {
              email: 'reception@fitaddis.com',
              password: 'SecurePass123!',
              first_name: 'Sarah',
              last_name: 'Johnson',
              phone: '+251 9 11 22-33-44',
              role: 'reception',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'User registered successfully',
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
        400: { description: 'Validation error or missing fields' },
        401: { description: 'Unauthenticated (missing or invalid token)' },
        403: { description: 'Insufficient permissions (not admin)' },
      },
    },
  },

  // ============================================================
  // ADMIN: MEMBER MANAGEMENT
  // ============================================================
  '/admin/members/{id}': {
    delete: {
      summary: 'Deactivate a member (Admin only)',
      description: 'Soft-deletes a member by deactivating their user account.',
      tags: ['Admin'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Member profile UUID',
        },
      ],
      responses: {
        200: {
          description: 'Member deactivated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/MemberProfileResponse' },
                  message: {
                    type: 'string',
                    example: 'Member deactivated successfully',
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden (insufficient permissions)' },
        404: { description: 'Member not found' },
      },
    },
  },

  '/admin/members/{id}/reactivate': {
    patch: {
      summary: 'Reactivate a member (Admin only)',
      description: 'Reactivates a previously deactivated member.',
      tags: ['Admin'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Member profile UUID',
        },
      ],
      responses: {
        200: {
          description: 'Member reactivated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/MemberProfileResponse' },
                  message: {
                    type: 'string',
                    example: 'Member reactivated successfully',
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Member not found' },
      },
    },
  },

  // ============================================================
  // ADMIN: TRAINER MANAGEMENT
  // ============================================================
  '/admin/trainers/{id}': {
    delete: {
      summary: 'Deactivate a trainer (Admin only)',
      description: 'Soft-deletes a trainer by deactivating their user account.',
      tags: ['Admin'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Trainer profile UUID',
        },
      ],
      responses: {
        200: {
          description: 'Trainer deactivated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/TrainerProfileResponse' },
                  message: {
                    type: 'string',
                    example: 'Trainer deactivated successfully',
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden (insufficient permissions)' },
        404: { description: 'Trainer not found' },
      },
    },
  },

  '/admin/trainers/{id}/reactivate': {
    patch: {
      summary: 'Reactivate a trainer (Admin only)',
      description: 'Reactivates a previously deactivated trainer.',
      tags: ['Admin'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Trainer profile UUID',
        },
      ],
      responses: {
        200: {
          description: 'Trainer reactivated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/TrainerProfileResponse' },
                  message: {
                    type: 'string',
                    example: 'Trainer reactivated successfully',
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Trainer not found' },
      },
    },
  },

  // ============================================================
  // ADMIN: HEALTH METRICS MANAGEMENT
  // ============================================================
  '/admin/health-metrics/{id}': {
    delete: {
      summary: 'Delete a health metric (Admin only)',
      description:
        'Permanently deletes a health metric by its MongoDB ObjectId.',
      tags: ['Admin'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'MongoDB ObjectId of the health metric',
        },
      ],
      responses: {
        200: {
          description: 'Health metric deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                    },
                  },
                  message: {
                    type: 'string',
                    example: 'Health metric deleted successfully',
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden (Admin only)' },
        404: { description: 'Health metric not found' },
      },
    },
  },

  // ============================================================
  // ADMIN: CLEANUP OLD NOTIFICATIONS
  // ============================================================
  '/admin/notifications/cleanup': {
    delete: {
      summary: 'Cleanup old read notifications (Admin only)',
      description:
        'Deletes read notifications older than a specified number of days. Admin only.',
      tags: ['Admin'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'days',
          in: 'query',
          schema: { type: 'integer', default: 30 },
          description: 'Delete notifications older than this many days',
        },
      ],
      responses: {
        200: {
          description: 'Old notifications cleaned up',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      deletedCount: { type: 'integer' },
                    },
                  },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden (Admin only)' },
      },
    },
  },

  // ============================================================
  // ADMIN: DELETE PROGRESS LOG
  // ============================================================
  '/admin/progress-logs/{id}': {
    delete: {
      summary: 'Delete a progress log (Admin only)',
      description: 'Permanently deletes a progress log entry.',
      tags: ['Admin'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Progress log UUID',
        },
      ],
      responses: {
        200: {
          description: 'Progress log deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: { message: { type: 'string' } },
                  },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden (Admin only)' },
        404: { description: 'Progress log not found' },
      },
    },
  },

  // ============================================================
  // ADMIN: GET FLAGGED RATINGS
  // ============================================================
  '/admin/ratings/flagged': {
    get: {
      summary: 'Get flagged ratings (Admin only)',
      description:
        'Returns all ratings below a threshold that have not been moderated.',
      tags: ['Admin'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'threshold',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 5,
            default: 3,
          },
          description:
            'Star threshold (e.g., 3 for ratings below 3 stars). Must be between 1 and 5.',
        },
      ],
      responses: {
        200: {
          description: 'Flagged ratings retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      count: { type: 'integer' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/RatingResponse' },
                      },
                    },
                  },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        400: {
          description: 'Invalid threshold (must be between 1 and 5)',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string' },
                  code: { type: 'string' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden (Admin only)' },
        503: { description: 'Service unavailable (database connection lost)' },
      },
    },
  },

  // ============================================================
  // ADMIN: MODERATE RATING
  // ============================================================

  '/admin/ratings/{id}/moderate': {
    patch: {
      summary: 'Moderate a rating (Admin only)',
      description: 'Adds moderation notes and marks a rating as moderated.',
      tags: ['Admin'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Rating UUID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['moderation_notes'],
              properties: {
                moderation_notes: {
                  type: 'string',
                  description:
                    'Admin note explaining why the rating was moderated',
                },
              },
            },
            example: {
              moderation_notes: 'Inappropriate language',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Rating moderated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/RatingResponse' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        400: { description: 'moderation_notes is required' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden (Admin only)' },
        404: { description: 'Rating not found' },
      },
    },
  },
};

const adminSchemas = {
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
        enum: ['member', 'trainer', 'reception'],
        description: 'Any role can be assigned by admin',
        example: 'reception',
      },
    },
  },

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
      message: { type: 'string', example: 'Member registration complete!' },
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
      message: { type: 'string', example: 'Trainer registration complete!' },
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
          role: { type: 'string', example: 'reception' },
        },
      },
      message: { type: 'string', example: 'User registered successfully.' },
    },
  },

  MemberProfileResponse: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      user_id: { type: 'string', format: 'uuid' },
      unique_member_id: { type: 'string', example: 'GYM-A3F9-7' },
      date_of_birth: { type: 'string', format: 'date', nullable: true },
      gender: { type: 'string', enum: ['male', 'female'], nullable: true },
      blood_type: {
        type: 'string',
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        nullable: true,
      },
      dietary_restrictions: { type: 'string', nullable: true },
      fitness_goal: {
        type: 'string',
        enum: [
          'weight_loss',
          'muscle_building',
          'maintenance',
          'general_fitness',
        ],
        nullable: true,
      },
      emergency_contact_name: { type: 'string', nullable: true },
      emergency_contact_phone: { type: 'string', nullable: true },
      email: { type: 'string', format: 'email' },
      first_name: { type: 'string' },
      last_name: { type: 'string' },
      phone: { type: 'string', nullable: true },
      is_active: { type: 'boolean' },
      role: {
        type: 'string',
        enum: ['member', 'trainer', 'admin', 'reception'],
      },
      subscription_status: {
        type: 'string',
        enum: ['active', 'frozen', 'expired', 'cancelled'],
        nullable: true,
      },
      tier_name: { type: 'string', nullable: true },
    },
  },

  TrainerProfileResponse: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      user_id: { type: 'string', format: 'uuid' },
      specialty: { type: 'string', nullable: true },
      years_of_experience: { type: 'integer', nullable: true },
      certification: { type: 'string', nullable: true },
      hourly_rate: { type: 'number', nullable: true },
      bio: { type: 'string', nullable: true },
      is_available: { type: 'boolean' },
      email: { type: 'string', format: 'email' },
      first_name: { type: 'string' },
      last_name: { type: 'string' },
      phone: { type: 'string', nullable: true },
      is_active: { type: 'boolean' },
      role: { type: 'string', enum: ['trainer'] },
    },
  },
};

module.exports = { adminPaths, adminSchemas };
