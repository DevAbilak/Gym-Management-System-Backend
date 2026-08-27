/**
 * Trainer API Documentation (OpenAPI)
 *
 * All trainer-related endpoints.
 * - Member: None (all require authentication)
 * - Trainer: /me, /:id (own profile), PATCH /:id (own profile), schedule, roster
 * - Admin/Reception: / (list all trainers), /user/:userId, etc.
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
        401: { description: 'Unauthorized (missing or invalid token)' },
        403: { description: 'Forbidden (user is not a trainer)' },
        404: { description: 'Trainer profile not found' },
      },
    },
  },

  // ============================================================
  // TRAINER BY ID (Ownership/Admin)
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
        403: { description: 'Forbidden (insufficient permissions)' },
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
  // LIST ALL TRAINERS (Admin/Reception only)
  // ============================================================
  '/trainers': {
    get: {
      summary: 'List all trainers (Admin/Reception only)',
      description:
        'Returns a paginated list of all trainers with optional filters.',
      tags: ['Trainers'],
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
  // RECORD PERSONAL TRAINING ATTENDANCE (Trainer only)
  // ============================================================
  '/trainers/attendance/{memberProfileId}': {
    post: {
      summary: 'Record personal training attendance (Trainer only)',
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

  // ============================================================
  // TRAINER WORKOUT TEMPLATES
  // ============================================================
  '/trainers/{trainerId}/templates': {
    get: {
      summary: 'Get workout templates for a trainer',
      description: `Returns all workout templates created by the trainer (plus public templates).
      
      **Access:**
      - **Trainer**: Can only view their **own** templates (plus public templates).
      - **Admin/Reception**: Can view **any** trainer's templates.`,
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
      ],
      responses: {
        200: {
          description: 'Workout templates retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/WorkoutTemplateResponse',
                    },
                  },
                  message: {
                    type: 'string',
                    example: 'Workout templates retrieved successfully',
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

  // ============================================================
  // TRAINER MEAL PLANS
  // ============================================================
  '/trainers/{trainerId}/meal-plans': {
    get: {
      summary: 'Get meal plans for a trainer',
      description: `Returns all meal plans created by the trainer.
      
      **Access:**
      - **Trainer**: Can only view their **own** meal plans.
      - **Admin/Reception**: Can view **any** trainer's meal plans.`,
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
      ],
      responses: {
        200: {
          description: 'Meal plans retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/MealPlanResponse' },
                  },
                  message: {
                    type: 'string',
                    example: 'Meal plans retrieved successfully',
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

  // ============================================================
  // ASSIGN PLAN TO MEMBER
  // ============================================================
  '/trainers/{trainerId}/assign-plan': {
    post: {
      summary: 'Assign a workout/meal plan to a member',
      description: `
      Assigns a workout template or meal plan (or both) to a member.
      - Automatically deactivates any previous active assignments for the member.
      - Sends an in-app notification to the member.
      
      **Access:**
      - **Trainer**: Can only assign plans to members they are assigned to.
      - **Admin/Reception**: Can assign plans to any member.
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
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AssignPlanRequest',
            },
            example: {
              member_profile_id: '550e8400-e29b-41d4-a716-446655440000',
              workout_template_id: '66c4a1b2c3d4e5f6g7h8i9j0',
              meal_plan_id: null,
              notes: 'Focus on upper body strength and core stability',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Plan assigned successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/AssignmentResponse' },
                  message: {
                    type: 'string',
                    example: 'Plan assigned successfully',
                  },
                },
              },
            },
          },
        },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden (insufficient permissions)' },
        404: { description: 'Trainer, member, or plan not found' },
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
  AssignPlanRequest: {
    type: 'object',
    required: ['member_profile_id'],
    properties: {
      member_profile_id: {
        type: 'string',
        format: 'uuid',
        description: 'PostgreSQL UUID of the member profile',
      },
      workout_template_id: {
        type: 'string',
        description: 'MongoDB ObjectId of the workout template (optional)',
        nullable: true,
      },
      meal_plan_id: {
        type: 'string',
        description: 'MongoDB ObjectId of the meal plan (optional)',
        nullable: true,
      },
      notes: {
        type: 'string',
        description: 'Optional notes for the assignment',
      },
    },
  },

  AssignmentResponse: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      member_profile_id: { type: 'string', format: 'uuid' },
      trainer_id: { type: 'string', format: 'uuid' },
      workout_template_id: { type: 'string', nullable: true },
      meal_plan_id: { type: 'string', nullable: true },
      assigned_at: { type: 'string', format: 'date-time' },
      is_active: { type: 'boolean' },
      notes: { type: 'string', nullable: true },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  },
};

module.exports = { trainerPaths, trainerSchemas };
