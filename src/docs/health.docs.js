/**
 * Health API Documentation (OpenAPI)
 *
 * All health metrics-related endpoints.
 */
const healthPaths = {
  // ============================================================
  // SAVE HEALTH METRIC
  // ============================================================
  '/health-metrics': {
    post: {
      summary: 'Save health metrics for a member',
      description: `
        Saves health metrics (weight, height, BMI, etc.) for a member.
        BMI is automatically calculated.
        - **Member**: Only their own metrics.
        - **Admin/Reception**: Any member.
        - **Trainer**: Cannot save health metrics.
      `,
      tags: ['Health'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/SaveHealthMetricRequest',
            },
            example: {
              member_id: '550e8400-e29b-41d4-a716-446655440000',
              weight_kg: 82,
              height_cm: 180,
              blood_type: 'O+',
              dietary_restrictions: 'Gluten-Free',
              body_fat_percentage: 15.5,
              muscle_mass_kg: 35.0,
              waist_cm: 82,
              notes: 'Post-workout measurement',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Health metric saved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/HealthMetricResponse' },
                  message: {
                    type: 'string',
                    example: 'Health metric saved successfully',
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
  // GET LATEST METRICS
  // ============================================================
  '/health-metrics/member/{memberId}/latest': {
    get: {
      summary: 'Get latest health metrics for a member',
      description: `
        Returns the most recent health metrics for a member.
        - **Member**: Only their own metrics.
        - **Trainer**: Only assigned members.
        - **Admin/Reception**: Any member.
      `,
      tags: ['Health'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'memberId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Member profile UUID',
        },
      ],
      responses: {
        200: {
          description: 'Latest health metrics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/HealthMetricResponse' },
                  message: {
                    type: 'string',
                    example: 'Latest health metrics retrieved successfully',
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Member not found or no metrics found' },
      },
    },
  },

  // ============================================================
  // GET METRICS HISTORY
  // ============================================================
  '/health-metrics/member/{memberId}/history': {
    get: {
      summary: 'Get health metrics history for a member',
      description: `
        Returns historical health metrics for a member with pagination.
        - **Member**: Only their own metrics.
        - **Trainer**: Only assigned members.
        - **Admin/Reception**: Any member.
      `,
      tags: ['Health'],
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
          description: 'Health metrics history retrieved successfully',
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
                          $ref: '#/components/schemas/HealthMetricResponse',
                        },
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer' },
                          limit: { type: 'integer' },
                        },
                      },
                    },
                  },
                  message: {
                    type: 'string',
                    example: 'Health metrics history retrieved successfully',
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
  // GET METRICS BY DATE RANGE
  // ============================================================
  '/health-metrics/member/{memberId}/range': {
    get: {
      summary: 'Get health metrics by date range',
      description: `
        Returns health metrics for a member within a specific date range.
        - **Member**: Only their own metrics.
        - **Trainer**: Only assigned members.
        - **Admin/Reception**: Any member.
      `,
      tags: ['Health'],
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
          name: 'startDate',
          in: 'query',
          required: true,
          schema: { type: 'string', format: 'date' },
          description: 'Start date (YYYY-MM-DD)',
        },
        {
          name: 'endDate',
          in: 'query',
          required: true,
          schema: { type: 'string', format: 'date' },
          description: 'End date (YYYY-MM-DD)',
        },
      ],
      responses: {
        200: {
          description: 'Health metrics by date range retrieved successfully',
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
                          $ref: '#/components/schemas/HealthMetricResponse',
                        },
                      },
                    },
                  },
                  message: {
                    type: 'string',
                    example:
                      'Health metrics by date range retrieved successfully',
                  },
                },
              },
            },
          },
        },
        400: { description: 'startDate and endDate are required' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Member not found' },
      },
    },
  },
};

const healthSchemas = {
  SaveHealthMetricRequest: {
    type: 'object',
    required: ['member_id', 'weight_kg', 'height_cm'],
    properties: {
      member_id: {
        type: 'string',
        format: 'uuid',
        description: 'PostgreSQL UUID of the member',
      },
      weight_kg: { type: 'number', format: 'float', example: 82 },
      height_cm: { type: 'number', format: 'float', example: 180 },
      blood_type: {
        type: 'string',
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      },
      dietary_restrictions: { type: 'string' },
      body_fat_percentage: { type: 'number', format: 'float' },
      muscle_mass_kg: { type: 'number', format: 'float' },
      waist_cm: { type: 'number', format: 'float' },
      notes: { type: 'string' },
    },
  },
  HealthMetricResponse: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '66c4a1b2c3d4e5f6g7h8i9j0' },
      member_id: { type: 'string', format: 'uuid' },
      weight_kg: { type: 'number' },
      height_cm: { type: 'number' },
      bmi: { type: 'number' },
      blood_type: { type: 'string', nullable: true },
      dietary_restrictions: { type: 'string', nullable: true },
      body_fat_percentage: { type: 'number', nullable: true },
      muscle_mass_kg: { type: 'number', nullable: true },
      waist_cm: { type: 'number', nullable: true },
      notes: { type: 'string', nullable: true },
      recorded_at: { type: 'string', format: 'date-time' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  },
};

module.exports = { healthPaths, healthSchemas };
