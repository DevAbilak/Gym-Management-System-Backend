/**
 * Class API Documentation (OpenAPI)
 *
 * All class-related endpoints.
 */
const classPaths = {
  '/classes': {
    get: {
      summary: 'List all classes',
      description:
        'Returns a list of all scheduled classes with optional filters.',
      tags: ['Classes'],
      parameters: [
        {
          name: 'date',
          in: 'query',
          schema: { type: 'string', format: 'date', example: '2026-08-20' },
          description: 'Filter by date (YYYY-MM-DD)',
        },
        {
          name: 'discipline',
          in: 'query',
          schema: {
            type: 'string',
            enum: [
              'yoga',
              'pilates',
              'hiit',
              'spin',
              'strength',
              'dance',
              'other',
            ],
          },
          description: 'Filter by discipline',
        },
        {
          name: 'trainer_id',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
          description: 'Filter by trainer ID',
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
          schema: { type: 'integer', default: 20 },
          description: 'Items per page',
        },
      ],
      responses: {
        200: {
          description: 'List of classes',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  count: { type: 'integer' },
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/ClassResponse',
                    },
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
    post: {
      summary: 'Create a new class',
      description: 'Creates a new class. Requires Admin or Trainer role.',
      tags: ['Classes'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateClassRequest',
            },
            example: {
              trainer_id: '550e8400-e29b-41d4-a716-446655440000',
              name: 'Morning HIIT Blast',
              description:
                'High-intensity interval training to start your day.',
              category: 'hiit',
              difficulty: 'intermediate',
              capacity: 20,
              start_time: '2026-08-20T07:00:00+03:00',
              end_time: '2026-08-20T08:00:00+03:00',
              location: 'Studio A',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Class created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/ClassResponse' },
                  message: {
                    type: 'string',
                    example: 'Class created successfully',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Validation error or missing fields',
        },
        401: {
          description: 'Unauthorized (missing or invalid token)',
        },
        403: {
          description: 'Forbidden (insufficient permissions)',
        },
      },
    },
  },

  '/classes/{id}': {
    get: {
      summary: 'Get class by ID',
      description: 'Returns a single class by its UUID.',
      tags: ['Classes'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Class UUID',
        },
      ],
      responses: {
        200: {
          description: 'Class found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/ClassResponse' },
                },
              },
            },
          },
        },
        404: {
          description: 'Class not found',
        },
      },
    },
    patch: {
      summary: 'Update a class',
      description: 'Updates an existing class. Requires Admin or Trainer role.',
      tags: ['Classes'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Class UUID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                category: {
                  type: 'string',
                  enum: [
                    'yoga',
                    'pilates',
                    'hiit',
                    'spin',
                    'strength',
                    'dance',
                    'other',
                  ],
                },
                difficulty: {
                  type: 'string',
                  enum: ['beginner', 'intermediate', 'advanced'],
                },
                capacity: { type: 'integer' },
                start_time: { type: 'string', format: 'date-time' },
                end_time: { type: 'string', format: 'date-time' },
                location: { type: 'string' },
                status: {
                  type: 'string',
                  enum: ['scheduled', 'cancelled', 'completed'],
                },
              },
            },
            example: {
              capacity: 25,
              status: 'scheduled',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Class updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/ClassResponse' },
                  message: {
                    type: 'string',
                    example: 'Class updated successfully',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Validation error',
        },
        401: {
          description: 'Unauthorized',
        },
        403: {
          description: 'Forbidden (insufficient permissions)',
        },
        404: {
          description: 'Class not found',
        },
      },
    },
  },
};

const classSchemas = {
  ClassResponse: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      trainer_id: { type: 'string', format: 'uuid' },
      trainer_name: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      category: { type: 'string' },
      difficulty: { type: 'string' },
      capacity: { type: 'integer' },
      current_bookings: { type: 'integer' },
      available_spots: { type: 'integer' },
      start_time: { type: 'string', format: 'date-time' },
      end_time: { type: 'string', format: 'date-time' },
      location: { type: 'string' },
      status: { type: 'string' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  },
  CreateClassRequest: {
    type: 'object',
    required: ['trainer_id', 'name', 'capacity', 'start_time', 'end_time'],
    properties: {
      trainer_id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      description: { type: 'string' },
      category: {
        type: 'string',
        enum: ['yoga', 'pilates', 'hiit', 'spin', 'strength', 'dance', 'other'],
      },
      difficulty: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'advanced'],
      },
      capacity: { type: 'integer' },
      start_time: { type: 'string', format: 'date-time' },
      end_time: { type: 'string', format: 'date-time' },
      location: { type: 'string' },
    },
  },
};

module.exports = { classPaths, classSchemas };
