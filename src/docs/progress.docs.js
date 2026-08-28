/**
 * Progress API Documentation (OpenAPI)
 *
 * All member progress logs endpoints.
 */
const progressPaths = {
  // ============================================================
  // LOG PROGRESS
  // ============================================================
  '/progress': {
    post: {
      summary: 'Log member progress',
      description: `
        Logs a new progress entry for a member (weight, body fat, muscle mass).
        - **Member**: Only for themselves (via active assignment).
        - **Trainer**: Only for assigned members.
        - **Admin/Reception**: Any member.
      `,
      tags: ['Progress'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/LogProgressRequest',
            },
            example: {
              member_assignment_id: '550e8400-e29b-41d4-a716-446655440000',
              weight_kg: 82.5,
              body_fat_percentage: 15.2,
              muscle_mass_kg: 35.0,
              notes: 'Post-workout measurement',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Progress logged successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/ProgressLogResponse' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Active assignment not found' },
      },
    },
  },

  // ============================================================
  // GET PROGRESS HISTORY
  // ============================================================
  '/progress/member/{memberProfileId}': {
    get: {
      summary: 'Get member progress history',
      description: `
        Returns paginated progress logs for a member.
        - **Member**: Only their own.
        - **Trainer**: Only assigned members.
        - **Admin/Reception**: Any member.
      `,
      tags: ['Progress'],
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
          description: 'Progress history retrieved successfully',
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
                          $ref: '#/components/schemas/ProgressLogResponse',
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

  // ============================================================
  // GET LATEST PROGRESS
  // ============================================================
  '/progress/member/{memberProfileId}/latest': {
    get: {
      summary: 'Get latest progress for a member',
      description: 'Returns the most recent progress log for a member.',
      tags: ['Progress'],
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
          description: 'Latest progress retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/ProgressLogResponse' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Member not found or no progress logged' },
      },
    },
  },
};

const progressSchemas = {
  LogProgressRequest: {
    type: 'object',
    required: ['member_assignment_id'],
    properties: {
      member_assignment_id: { type: 'string', format: 'uuid' },
      weight_kg: { type: 'number', format: 'float', example: 82.5 },
      body_fat_percentage: { type: 'number', format: 'float', example: 15.2 },
      muscle_mass_kg: { type: 'number', format: 'float', example: 35.0 },
      notes: { type: 'string' },
    },
  },
  ProgressLogResponse: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      member_assignment_id: { type: 'string', format: 'uuid' },
      weight_kg: { type: 'number', nullable: true },
      body_fat_percentage: { type: 'number', nullable: true },
      muscle_mass_kg: { type: 'number', nullable: true },
      notes: { type: 'string', nullable: true },
      logged_at: { type: 'string', format: 'date-time' },
      created_at: { type: 'string', format: 'date-time' },
      trainer_name: {
        type: 'string',
        description: 'Full name of the trainer who logged this entry',
      },
    },
  },
};

module.exports = { progressPaths, progressSchemas };
