const adminPaths = {
  // --------- AUTH MANAGEMENT -------------
  '/admin/register': {
    post: {
      summary: 'Admin: Register any user',
      description:
        'Creates a user account with any role (member, trainer, reception). Admin-only endpoint.',
      tags: ['Admin'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AdminRegistrationRequest',
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
        400: {
          description: 'Validation error or missing fields',
        },
        403: {
          description: 'Insufficient permissions (not admin)',
        },
        401: {
          description: 'Unauthenticated (missing or invalid token)',
        },
      },
    },
  },

  // ---------- MEMBER MANAGEMENT ----------
  '/admin/members': {
    get: {
      summary: 'Admin: List all members',
      description:
        'Returns a paginated list of all members with optional filters.',
      tags: ['Admin'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
          description: 'Page number',
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 20, maximum: 100 },
          description: 'Items per page',
        },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Search by name, email, or unique member ID',
        },
        {
          name: 'status',
          in: 'query',
          schema: { type: 'string', enum: ['active', 'inactive'] },
          description: 'Filter by member status (active/inactive)',
        },
      ],
      responses: {
        200: {
          description: 'Members retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/MemberProfileResponse',
                        },
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer' },
                          limit: { type: 'integer' },
                          total: { type: 'integer' },
                          totalPages: { type: 'integer' },
                        },
                      },
                    },
                  },
                  message: {
                    type: 'string',
                    example: 'Members retrieved successfully',
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden (insufficient permissions)' },
      },
    },
  },

  '/admin/members/{id}/deactivate': {
    patch: {
      summary: 'Admin: Deactivate a member',
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
      summary: 'Admin: Reactivate a member',
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
        403: { description: 'Forbidden (insufficient permissions)' },
        404: { description: 'Member not found' },
      },
    },
  },

  // ------------ TRAINER MANAGEMENT ------------

  '/admin/trainers': {
    get: {
      summary: 'List all trainers (Admin/Reception only)',
      description:
        'Returns a paginated list of all trainers with optional filters.',
      tags: ['Admin'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
          description: 'Page number',
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 20, maximum: 100 },
          description: 'Items per page',
        },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Search by name, email, or specialty',
        },
        {
          name: 'is_available',
          in: 'query',
          schema: { type: 'boolean' },
          description: 'Filter by availability',
        },
      ],
      responses: {
        200: {
          description: 'Trainers retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/TrainerProfileResponse',
                        },
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer' },
                          limit: { type: 'integer' },
                          total: { type: 'integer' },
                          totalPages: { type: 'integer' },
                        },
                      },
                    },
                  },
                  message: {
                    type: 'string',
                    example: 'Trainers retrieved successfully',
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden (insufficient permissions)' },
      },
    },
  },

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
};

module.exports = { adminPaths, adminSchemas };
