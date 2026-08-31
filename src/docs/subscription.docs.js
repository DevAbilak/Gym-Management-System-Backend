/**
 * Subscription API Documentation (OpenAPI)
 *
 * All subscription-related endpoints.
 */
const subscriptionPaths = {
  // ============================================================
  // CREATE SUBSCRIPTION (Admin/Reception)
  // ============================================================
  '/subscriptions': {
    post: {
      summary: 'Create a subscription (Admin/Reception only)',
      description: `
        Creates a subscription directly (bypassing payment).
        This sets the subscription status to 'active' immediately.
        - **Admin/Reception**: Can create for any member.
      `,
      tags: ['Subscriptions'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateSubscriptionRequest',
            },
            example: {
              member_profile_id: '550e8400-e29b-41d4-a716-446655440000',
              membership_tier_id: '550e8400-e29b-41d4-a716-446655440001',
              start_date: '2026-09-01',
              auto_renew: true,
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Subscription created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/SubscriptionResponse' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden (insufficient permissions)' },
        404: { description: 'Member or tier not found' },
        409: { description: 'Member already has an active subscription' },
      },
    },
  },

  // ============================================================
  // UPDATE SUBSCRIPTION STATUS
  // ============================================================
  '/subscriptions/{id}/status': {
    patch: {
      summary: 'Update subscription status (Admin/Reception only)',
      description: `
        Changes the status of a subscription.
        - **active**: Member has full access.
        - **frozen**: Temporarily suspended (sets frozen_until date).
        - **expired**: Subscription has ended.
        - **cancelled**: Member cancelled (or admin terminated).
      `,
      tags: ['Subscriptions'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Subscription UUID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: {
                  type: 'string',
                  enum: ['active', 'frozen', 'expired', 'cancelled'],
                },
              },
            },
            example: {
              status: 'frozen',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Subscription status updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/SubscriptionResponse' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden (insufficient permissions)' },
        404: { description: 'Subscription not found' },
      },
    },
  },

  // ============================================================
  // GET ACTIVE SUBSCRIPTION
  // ============================================================
  '/subscriptions/active/{memberProfileId}': {
    get: {
      summary: 'Get active subscription for a member',
      description: `
        Returns the active subscription for a member (if any).
        - **Member**: Only their own.
        - **Admin/Reception**: Any member.
      `,
      tags: ['Subscriptions'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'memberProfileId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Member profile UUID',
        },
      ],
      responses: {
        200: {
          description: 'Active subscription retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/SubscriptionResponse' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Member not found or no active subscription' },
      },
    },
  },

  // ============================================================
  // GET ALL SUBSCRIPTIONS FOR A MEMBER
  // ============================================================
  '/subscriptions/member/{memberProfileId}': {
    get: {
      summary: 'Get all subscriptions for a member',
      description: `
        Returns all subscriptions (historical and current) for a member.
        - **Member**: Only their own.
        - **Admin/Reception**: Any member.
      `,
      tags: ['Subscriptions'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'memberProfileId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Member profile UUID',
        },
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
      ],
      responses: {
        200: {
          description: 'Subscriptions retrieved successfully',
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
                          $ref: '#/components/schemas/SubscriptionResponse',
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
                  message: { type: 'string' },
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
};

const subscriptionSchemas = {
  CreateSubscriptionRequest: {
    type: 'object',
    required: ['member_profile_id', 'membership_tier_id'],
    properties: {
      member_profile_id: {
        type: 'string',
        format: 'uuid',
        description: 'UUID of the member profile',
      },
      membership_tier_id: {
        type: 'string',
        format: 'uuid',
        description: 'UUID of the membership tier',
      },
      start_date: {
        type: 'string',
        format: 'date',
        description: 'Start date (YYYY-MM-DD), defaults to today',
      },
      auto_renew: {
        type: 'boolean',
        description: 'Whether the subscription should auto-renew',
        default: false,
      },
    },
  },
  SubscriptionResponse: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      member_profile_id: { type: 'string', format: 'uuid' },
      membership_tier_id: { type: 'string', format: 'uuid' },
      status: {
        type: 'string',
        enum: ['pending', 'active', 'frozen', 'expired', 'cancelled'],
      },
      start_date: { type: 'string', format: 'date' },
      expiry_date: { type: 'string', format: 'date' },
      frozen_until: { type: 'string', format: 'date', nullable: true },
      auto_renew: { type: 'boolean' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
      tier_name: { type: 'string' },
      price: { type: 'number' },
      duration_months: { type: 'integer' },
    },
  },
};

module.exports = { subscriptionPaths, subscriptionSchemas };
