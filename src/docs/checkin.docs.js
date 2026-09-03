/**
 * Check-in API Documentation (OpenAPI)
 *
 * All check-in related endpoints.
 */
const checkinPaths = {
  // ============================================================
  // GET MEMBER BY UNIQUE ID (Admin/Reception only)
  // ============================================================
  '/checkin/member/{uniqueId}': {
    get: {
      summary: 'Get member by unique ID (Admin/Reception only)',
      description: `
      Looks up a member by their unique gym ID (GYM-XXXX-X).
      Uses Redis cache if available for fast lookups (<1s).
      Useful for reception to verify member details before check-in.
    `,
      tags: ['Check-in'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'uniqueId',
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
                  data: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      unique_member_id: { type: 'string' },
                      user_id: { type: 'string', format: 'uuid' },
                      first_name: { type: 'string' },
                      last_name: { type: 'string' },
                      email: { type: 'string', format: 'email' },
                      phone: { type: 'string' },
                      is_active: { type: 'boolean' },
                      subscription_status: {
                        type: 'string',
                        enum: ['active', 'frozen', 'expired', 'cancelled'],
                        nullable: true,
                      },
                      expiry_date: {
                        type: 'string',
                        format: 'date',
                        nullable: true,
                      },
                    },
                  },
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
  // STANDARD CHECK-IN
  // ============================================================
  '/checkin/{uniqueId}': {
    post: {
      summary: 'Standard check-in by unique member ID (Admin/Reception only)',
      description: `
        Records a member's check-in using their unique gym ID (GYM-XXXX-X).
        Requires an active subscription.
      `,
      tags: ['Check-in'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'uniqueId',
          in: 'path',
          required: true,
          schema: { type: 'string', pattern: '^GYM-[A-Z0-9]{4}-[0-9]$' },
          description: 'Unique member ID (e.g., GYM-A3F9-7)',
        },
      ],
      responses: {
        200: {
          description: 'Check-in successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      member: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          unique_member_id: { type: 'string' },
                          full_name: { type: 'string' },
                          email: { type: 'string' },
                        },
                      },
                      checkin: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          member_profile_id: { type: 'string', format: 'uuid' },
                          check_in_type: { type: 'string' },
                          checked_in_at: {
                            type: 'string',
                            format: 'date-time',
                          },
                          verified_by: { type: 'string', format: 'uuid' },
                        },
                      },
                      status: { type: 'string', example: 'success' },
                    },
                  },
                  message: { type: 'string', example: 'Check-in successful' },
                },
              },
            },
          },
        },
        403: {
          description: 'Subscription inactive or account deactivated',
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
        404: {
          description: 'Member not found',
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
      },
    },
  },

  // ============================================================
  // OVERRIDE CHECK-IN
  // ============================================================
  '/checkin/override/{uniqueId}': {
    post: {
      summary: 'Override check-in (Reception/Admin only)',
      description: `
        Force check-in a member bypassing subscription validation.
        - Requires: Reception or Admin role.
        - Bypasses subscription status, but logs the override reason.
      `,
      tags: ['Check-in'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'uniqueId',
          in: 'path',
          required: true,
          schema: { type: 'string', pattern: '^GYM-[A-Z0-9]{4}-[0-9]$' },
          description: 'Unique member ID (e.g., GYM-A3F9-7)',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['reason'],
              properties: {
                reason: {
                  type: 'string',
                  description: 'Reason for the override',
                  example: 'Member paid cash at the front desk',
                },
              },
            },
            example: {
              reason: 'Member paid cash at the front desk',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Override check-in successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      member: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          unique_member_id: { type: 'string' },
                          full_name: { type: 'string' },
                        },
                      },
                      checkin: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          notes: {
                            type: 'string',
                            example:
                              'OVERRIDE: Member paid cash at the front desk',
                          },
                        },
                      },
                      override: { type: 'boolean', example: true },
                      reason: { type: 'string' },
                    },
                  },
                  message: { type: 'string' },
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
  // CHECK-IN HISTORY
  // ============================================================
  '/checkin/history/{memberId}': {
    get: {
      summary: 'Get check-in history for a member',
      description: `
        Returns the check-in history for a specific member.
        - **Member**: Only their own history.
        - **Admin/Reception**: Any member.
      `,
      tags: ['Check-in'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'memberId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Member profile UUID',
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 50, maximum: 100 },
          description: 'Number of records to return',
        },
      ],
      responses: {
        200: {
          description: 'Check-in history retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        check_in_type: { type: 'string' },
                        checked_in_at: { type: 'string', format: 'date-time' },
                        checked_out_at: {
                          type: 'string',
                          format: 'date-time',
                          nullable: true,
                        },
                        notes: { type: 'string', nullable: true },
                        verified_by: {
                          type: 'string',
                          format: 'uuid',
                          nullable: true,
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

  // ============================================================
  // TODAY'S CHECK-INS
  // ============================================================
  '/checkin/today': {
    get: {
      summary: 'Get today\'s check-ins (Admin/Reception only)',
      description: 'Returns a list of all check-ins recorded today.',
      tags: ['Check-in'],
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Today\'s check-ins retrieved successfully',
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
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', format: 'uuid' },
                            checked_in_at: {
                              type: 'string',
                              format: 'date-time',
                            },
                            checked_out_at: {
                              type: 'string',
                              format: 'date-time',
                              nullable: true,
                            },
                            notes: { type: 'string', nullable: true },
                            unique_member_id: { type: 'string' },
                            first_name: { type: 'string' },
                            last_name: { type: 'string' },
                            email: { type: 'string', format: 'email' },
                            phone: { type: 'string' },
                          },
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
        403: { description: 'Forbidden (insufficient permissions)' },
      },
    },
  },
};

const checkinSchemas = {
  CheckinResponse: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      member_profile_id: { type: 'string', format: 'uuid' },
      check_in_type: { type: 'string' },
      checked_in_at: { type: 'string', format: 'date-time' },
      checked_out_at: { type: 'string', format: 'date-time', nullable: true },
      verified_by: { type: 'string', format: 'uuid', nullable: true },
      notes: { type: 'string', nullable: true },
    },
  },
};

module.exports = { checkinPaths, checkinSchemas };
