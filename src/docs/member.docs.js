/**
 * Member API Documentation (OpenAPI)
 *
 * All member-related endpoints.
 * - Public: None (all require authentication)
 * - Member: /me, /:id (own profile), PATCH /:id (own profile)
 * - Admin/Reception: /, /user/:userId, /unique/:uniqueId
 */
const memberPaths = {
  // ============================================================
  // CURRENT MEMBER PROFILE
  // ============================================================
  '/members/me': {
    get: {
      summary: 'Get current member profile',
      description: 'Returns the member profile for the authenticated user.',
      tags: ['Members'],
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Member profile retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/MemberProfileResponse' },
                  message: {
                    type: 'string',
                    example: 'Current member profile retrieved successfully',
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized (missing or invalid token)' },
        404: { description: 'Member profile not found' },
      },
    },
  },

  // ============================================================
  // MEMBER BY ID (Ownership check)
  // ============================================================
  '/members/{id}': {
    get: {
      summary: 'Get member by ID',
      description: `
        Returns a member profile by UUID.
        - **Member**: Only their own profile.
        - **Trainer**: Only assigned members (active assignment).
        - **Admin/Reception**: Any member.
      `,
      tags: ['Members'],
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
          description: 'Member retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/MemberProfileResponse' },
                  message: {
                    type: 'string',
                    example: 'Member retrieved successfully',
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
    patch: {
      summary: 'Update member profile',
      description: `
        Updates a member profile.
        - **Member**: Only their own profile.
        - **Admin/Reception**: Any member.
        - **Trainer**: Not allowed (trainers cannot update member profiles).
      `,
      tags: ['Members'],
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
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateMemberRequest',
            },
            example: {
              emergency_contact_name: 'Jane Doe',
              emergency_contact_phone: '+251 9 88 77-66-55',
              fitness_goal: 'weight_loss',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Member updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/MemberProfileResponse' },
                  message: {
                    type: 'string',
                    example: 'Member updated successfully',
                  },
                },
              },
            },
          },
        },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Member not found' },
      },
    },
  },

  // ============================================================
  // LIST ALL MEMBERS (Admin/Reception only)
  // ============================================================
  '/members': {
    get: {
      summary: 'List all members (Admin/Reception only)',
      description:
        'Returns a paginated list of all members with optional filters.',
      tags: ['Members'],
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

  // ============================================================
  // MEMBER BY USER ID (Admin/Reception only)
  // ============================================================
  '/members/user/{userId}': {
    get: {
      summary: 'Get member by user ID (Admin/Reception only)',
      description:
        'Returns a member profile by user UUID. Admin/Reception only.',
      tags: ['Members'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'User UUID',
        },
      ],
      responses: {
        200: {
          description: 'Member retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/MemberProfileResponse' },
                  message: {
                    type: 'string',
                    example: 'Member retrieved successfully',
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

  // ============================================================
  // MEMBER BY UNIQUE ID (Admin/Reception only)
  // ============================================================
  '/members/unique/{uniqueMemberId}': {
    get: {
      summary: 'Get member by unique member ID (GYM-XXXX-X)',
      description:
        'Returns a member profile by their gym ID. Admin/Reception only.',
      tags: ['Members'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'uniqueMemberId',
          in: 'path',
          required: true,
          schema: { type: 'string', pattern: '^GYM-[A-Z0-9]{4}-[0-9]$' },
          description: 'Unique member ID (e.g., GYM-A3F9-7)',
        },
      ],
      responses: {
        200: {
          description: 'Member retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/MemberProfileResponse' },
                  message: {
                    type: 'string',
                    example: 'Member retrieved successfully',
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
};

const memberSchemas = {
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
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
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
  UpdateMemberRequest: {
    type: 'object',
    properties: {
      date_of_birth: {
        type: 'string',
        format: 'date',
        example: '1996-01-01',
        description: 'Date of birth (YYYY-MM-DD)',
      },
      gender: {
        type: 'string',
        enum: ['male', 'female'],
        example: 'male',
      },
      blood_type: {
        type: 'string',
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        example: 'O+',
      },
      dietary_restrictions: {
        type: 'string',
        example: 'Gluten-Free',
      },
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
      emergency_contact_name: {
        type: 'string',
        example: 'Jane Doe',
      },
      emergency_contact_phone: {
        type: 'string',
        example: '+251 9 88 77-66-55',
      },
    },
  },
};

module.exports = { memberPaths, memberSchemas };
