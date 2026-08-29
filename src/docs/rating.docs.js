/**
 * Rating API Documentation (OpenAPI)
 *
 * All rating-related endpoints.
 */
const ratingPaths = {
  // ============================================================
  // SUBMIT RATING
  // ============================================================
  '/ratings/{type}': {
    post: {
      summary: 'Submit a rating',
      description: `
        Submit a rating for a trainer, class, or facility.
        - **Access**: Members only.
        - **Trainer rating**: Requires having attended a session with that trainer.
        - **Class rating**: Requires having booked that class.
        - **Facility rating**: No specific requirements.
        - **Duplicate prevention**: A member can only rate each trainer/class/facility once.
      `,
      tags: ['Ratings'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'path',
          required: true,
          schema: { type: 'string', enum: ['trainer', 'facility', 'class'] },
          description: 'Type of rating',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/SubmitRatingRequest',
            },
            examples: {
              trainer: {
                summary: 'Trainer Rating Example',
                value: {
                  trainer_id: '550e8400-e29b-41d4-a716-446655440000',
                  rating_stars: 5,
                  rating_dimension: 'punctuality',
                  comment: 'Excellent coach!',
                  is_anonymous: false,
                },
              },
              facility: {
                summary: 'Facility Rating Example',
                value: {
                  rating_stars: 4,
                  comment: 'Clean equipment, friendly staff',
                  is_anonymous: true,
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Rating submitted successfully',
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
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: {
          description:
            'Forbidden (not a member, no active subscription, or no qualifying session/booking)',
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
        404: { description: 'Trainer/Class not found' },
        409: {
          description: 'Duplicate rating (member already rated this target)',
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
      },
    },
  },

  // ============================================================
  // GET TRAINER AVERAGE RATING
  // ============================================================
  '/ratings/trainer/{trainerId}/average': {
    get: {
      summary: 'Get trainer average rating',
      description: `
        Returns the average rating and review counts for a trainer.
        - **Trainer**: Only their own.
        - **Admin/Reception**: Any trainer.
        - **Member**: Only their assigned trainer.
      `,
      tags: ['Ratings'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'trainerId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Trainer profile UUID',
        },
      ],
      responses: {
        200: {
          description: 'Trainer rating retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      average_rating: { type: 'number' },
                      total_reviews: { type: 'integer' },
                      five_star_count: { type: 'integer' },
                      four_star_count: { type: 'integer' },
                      three_star_count: { type: 'integer' },
                      two_star_count: { type: 'integer' },
                      one_star_count: { type: 'integer' },
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
        404: { description: 'Trainer not found' },
      },
    },
  },

  // ============================================================
  // GET FACILITY RATING SUMMARY — PUBLIC
  // ============================================================
  '/ratings/facility': {
    get: {
      summary: 'Get facility rating summary',
      description:
        'Returns the overall facility rating average and total reviews. **Public endpoint — no authentication required.**',
      tags: ['Ratings'],
      // ✅ SECURITY REMOVED: This endpoint is now public
      responses: {
        200: {
          description: 'Facility rating retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      average_rating: { type: 'number' },
                      total_reviews: { type: 'integer' },
                    },
                  },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        500: { description: 'Server error' },
      },
    },
  },
};

const ratingSchemas = {
  SubmitRatingRequest: {
    type: 'object',
    required: ['rating_stars'],
    properties: {
      trainer_id: {
        type: 'string',
        format: 'uuid',
        description: 'Required for trainer rating',
      },
      class_id: {
        type: 'string',
        format: 'uuid',
        description: 'Required for class rating',
      },
      rating_stars: { type: 'integer', enum: [1, 2, 3, 4, 5] },
      rating_dimension: { type: 'string' },
      comment: { type: 'string' },
      is_anonymous: { type: 'boolean', default: false },
    },
  },
  RatingResponse: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      member_profile_id: { type: 'string', format: 'uuid' },
      rating_type: { type: 'string', enum: ['trainer', 'facility', 'class'] },
      trainer_id: { type: 'string', format: 'uuid', nullable: true },
      class_id: { type: 'string', format: 'uuid', nullable: true },
      rating_stars: { type: 'integer' },
      rating_dimension: { type: 'string', nullable: true },
      comment: { type: 'string', nullable: true },
      is_anonymous: { type: 'boolean' },
      is_moderated: { type: 'boolean' },
      moderation_notes: { type: 'string', nullable: true },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
      member_name: { type: 'string', nullable: true },
      trainer_name: { type: 'string', nullable: true },
    },
  },
};

module.exports = { ratingPaths, ratingSchemas };
