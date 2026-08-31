/**
 * Payment API Documentation (OpenAPI)
 *
 * All payment-related endpoints.
 */
const paymentPaths = {
  // ============================================================
  // INITIATE PAYMENT
  // ============================================================
  '/payments/init': {
    post: {
      summary: 'Initiate a payment for a new subscription',
      description: `
        Creates a pending subscription and initiates a StarPay payment session.
        Returns a payment URL for the customer to complete payment.
        - **Member**: Can initiate for themselves.
        - **Admin/Reception**: Can initiate for any member.
      `,
      tags: ['Payments'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/InitPaymentRequest',
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
          description: 'Payment initiated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      subscription: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          member_profile_id: { type: 'string', format: 'uuid' },
                          membership_tier_id: {
                            type: 'string',
                            format: 'uuid',
                          },
                          status: { type: 'string', enum: ['pending'] },
                          start_date: { type: 'string', format: 'date' },
                          expiry_date: { type: 'string', format: 'date' },
                          auto_renew: { type: 'boolean' },
                        },
                      },
                      payment: {
                        type: 'object',
                        properties: {
                          billRefNo: { type: 'string' },
                          paymentUrl: { type: 'string' },
                        },
                      },
                    },
                  },
                  message: {
                    type: 'string',
                    example: 'Payment initiated successfully',
                  },
                },
              },
            },
          },
        },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Member or tier not found' },
        409: { description: 'Member already has an active subscription' },
        500: { description: 'Payment gateway error' },
      },
    },
  },

  // ============================================================
  // VERIFY PAYMENT
  // ============================================================
  '/payments/verify/{orderId}': {
    get: {
      summary: 'Verify payment status',
      description: 'Checks the status of a payment using the StarPay order ID.',
      tags: ['Payments'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'orderId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'StarPay order ID (returned from the /init endpoint)',
        },
      ],
      responses: {
        200: {
          description: 'Payment status retrieved',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      order_id: { type: 'string' },
                      status: {
                        type: 'string',
                        enum: ['PAID', 'FAILED', 'PENDING'],
                      },
                      amount: { type: 'number' },
                      currency: { type: 'string' },
                      updated_at: { type: 'string', format: 'date-time' },
                    },
                  },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        404: { description: 'Payment not found' },
      },
    },
  },
};

const paymentSchemas = {
  InitPaymentRequest: {
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
};

module.exports = { paymentPaths, paymentSchemas };
