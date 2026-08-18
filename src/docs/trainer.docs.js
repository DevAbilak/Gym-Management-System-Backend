/**
 * Trainer API Documentation (OpenAPI)
 *
 * All trainer-facing endpoints.
 * Admin management endpoints are documented in admin.docs.js.
 */
const trainerPaths = {
  // ============================================================
  // CURRENT TRAINER PROFILE
  // ============================================================
  '/trainers/me': {
    get: {
      summary: 'Get current trainer profile',
      description:
        'Returns the trainer profile for the authenticated user (must have trainer role).',
      tags: ['Trainers'],
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Trainer profile retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/TrainerProfileResponse' },
                  message: {
                    type: 'string',
                    example: 'Current trainer profile retrieved successfully',
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        404: { description: 'Trainer profile not found' },
      },
    },
  },

  // ============================================================
  // TRAINER BY ID
  // ============================================================
  '/trainers/{id}': {
    get: {
      summary: 'Get trainer by ID',
      description: `
        Returns a trainer profile by UUID.
        - **Trainer**: Only their own profile.
        - **Admin/Reception**: Any trainer.
      `,
      tags: ['Trainers'],
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
          description: 'Trainer retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/TrainerProfileResponse' },
                  message: {
                    type: 'string',
                    example: 'Trainer retrieved successfully',
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
    patch: {
      summary: 'Update trainer profile',
      description: `
        Updates a trainer profile.
        - **Trainer**: Only their own profile.
        - **Admin/Reception**: Any trainer.
      `,
      tags: ['Trainers'],
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
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateTrainerRequest',
            },
            example: {
              specialty: 'Yoga & Pilates',
              years_of_experience: 6,
              certification: 'RYT-500',
              hourly_rate: 55.0,
              bio: 'Certified yoga instructor with 6 years of experience.',
              is_available: true,
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Trainer updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/TrainerProfileResponse' },
                  message: {
                    type: 'string',
                    example: 'Trainer updated successfully',
                  },
                },
              },
            },
          },
        },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Trainer not found' },
      },
    },
  },

  // ============================================================
  // TRAINER SCHEDULE
  // ============================================================
  '/trainers/{id}/schedule': {
    get: {
      summary: 'Get trainer schedule',
      description: `
        Returns the upcoming class schedule for a trainer.
        - **Trainer**: Only their own schedule.
        - **Admin/Reception**: Any trainer.
      `,
      tags: ['Trainers'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Trainer profile UUID',
        },
        {
          name: 'date',
          in: 'query',
          schema: { type: 'string', format: 'date' },
          description: 'Filter by date (YYYY-MM-DD)',
        },
      ],
      responses: {
        200: {
          description: 'Trainer schedule retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      trainer: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          full_name: { type: 'string' },
                          specialty: { type: 'string' },
                        },
                      },
                      schedule: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', format: 'uuid' },
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
                            confirmed_bookings: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                  message: {
                    type: 'string',
                    example: 'Trainer schedule retrieved successfully',
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
  // TRAINER ROSTER
  // ============================================================
  '/trainers/{id}/roster': {
    get: {
      summary: 'Get trainer roster (assigned members)',
      description: `
        Returns the list of members assigned to a trainer.
        - **Trainer**: Only their own roster.
        - **Admin/Reception**: Any trainer.
      `,
      tags: ['Trainers'],
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
          description: 'Trainer roster retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      trainer: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          full_name: { type: 'string' },
                          specialty: { type: 'string' },
                        },
                      },
                      count: { type: 'integer' },
                      roster: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            member_profile_id: {
                              type: 'string',
                              format: 'uuid',
                            },
                            unique_member_id: { type: 'string' },
                            user_id: { type: 'string', format: 'uuid' },
                            first_name: { type: 'string' },
                            last_name: { type: 'string' },
                            email: { type: 'string', format: 'email' },
                            phone: { type: 'string' },
                            assigned_at: {
                              type: 'string',
                              format: 'date-time',
                            },
                            is_active: { type: 'boolean' },
                            active_workout_plan: {
                              type: 'string',
                              nullable: true,
                            },
                            fitness_goal: { type: 'string', nullable: true },
                            subscription_status: {
                              type: 'string',
                              nullable: true,
                            },
                          },
                        },
                      },
                    },
                  },
                  message: {
                    type: 'string',
                    example: 'Trainer roster retrieved successfully',
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
  // CLASS ROSTER
  // ============================================================
  '/trainers/{trainerId}/classes/{classId}/roster': {
    get: {
      summary: 'Get class roster (members booked for a specific class)',
      description: `
        Returns the list of members booked for a trainer's specific class.
        - **Trainer**: Only their own class rosters.
        - **Admin/Reception**: Any trainer's class rosters.
      `,
      tags: ['Trainers'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'trainerId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Trainer profile UUID',
        },
        {
          name: 'classId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Class UUID',
        },
      ],
      responses: {
        200: {
          description: 'Class roster retrieved successfully',
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
                        class_id: { type: 'string', format: 'uuid' },
                        class_name: { type: 'string' },
                        start_time: { type: 'string', format: 'date-time' },
                        end_time: { type: 'string', format: 'date-time' },
                        booking_id: { type: 'string', format: 'uuid' },
                        booking_reference: { type: 'string' },
                        status: { type: 'string' },
                        booked_at: { type: 'string', format: 'date-time' },
                        member_profile_id: { type: 'string', format: 'uuid' },
                        unique_member_id: { type: 'string' },
                        first_name: { type: 'string' },
                        last_name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        phone: { type: 'string' },
                      },
                    },
                  },
                  message: {
                    type: 'string',
                    example: 'Class roster retrieved successfully',
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Trainer or class not found' },
      },
    },
  },

  // ============================================================
  // CLIENT FEEDBACK
  // ============================================================
  '/trainers/{id}/feedback': {
    get: {
      summary: 'Get client feedback for a trainer',
      description: `
        Returns feedback/ratings received by a trainer.
        - **Trainer**: Only their own feedback.
        - **Admin/Reception**: Any trainer.
      `,
      tags: ['Trainers'],
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
          description: 'Client feedback retrieved successfully',
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
                      feedback: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', format: 'uuid' },
                            member_profile_id: {
                              type: 'string',
                              format: 'uuid',
                            },
                            rating_type: { type: 'string' },
                            class_id: {
                              type: 'string',
                              format: 'uuid',
                              nullable: true,
                            },
                            rating_stars: { type: 'integer' },
                            rating_dimension: {
                              type: 'string',
                              nullable: true,
                            },
                            comment: { type: 'string', nullable: true },
                            is_anonymous: { type: 'boolean' },
                            created_at: { type: 'string', format: 'date-time' },
                            first_name: { type: 'string' },
                            last_name: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                  message: {
                    type: 'string',
                    example: 'Client feedback retrieved successfully',
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
  // RECORD PERSONAL TRAINING ATTENDANCE
  // ============================================================
  '/trainers/attendance/{memberProfileId}': {
    post: {
      summary: 'Record personal training attendance',
      description: `
        Records a personal training session attendance for a member.
        - **Trainer**: Only trainers can record attendance.
        - Records are saved in attendance_records with type 'personal_training'.
      `,
      tags: ['Trainers'],
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
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                notes: {
                  type: 'string',
                  example: 'PT session - focused on deadlifts',
                },
              },
            },
            example: {
              notes: 'PT session - focused on deadlifts',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Personal training attendance recorded successfully',
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
                      member_profile_id: { type: 'string', format: 'uuid' },
                      check_in_type: {
                        type: 'string',
                        example: 'personal_training',
                      },
                      checked_in_at: { type: 'string', format: 'date-time' },
                      verified_by: { type: 'string', format: 'uuid' },
                      notes: { type: 'string', nullable: true },
                    },
                  },
                  message: {
                    type: 'string',
                    example:
                      'Personal training attendance recorded successfully',
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden (trainer role required)' },
        404: { description: 'Trainer or member not found' },
      },
    },
  },
};

const trainerSchemas = {
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
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
      email: { type: 'string', format: 'email' },
      first_name: { type: 'string' },
      last_name: { type: 'string' },
      phone: { type: 'string', nullable: true },
      is_active: { type: 'boolean' },
      role: { type: 'string', enum: ['trainer'] },
    },
  },
  UpdateTrainerRequest: {
    type: 'object',
    properties: {
      specialty: { type: 'string' },
      years_of_experience: { type: 'integer' },
      certification: { type: 'string' },
      hourly_rate: { type: 'number' },
      bio: { type: 'string' },
      is_available: { type: 'boolean' },
    },
  },
};

module.exports = { trainerPaths, trainerSchemas };
