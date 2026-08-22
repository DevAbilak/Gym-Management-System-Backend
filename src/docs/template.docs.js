/**
 * Template API Documentation (OpenAPI)
 *
 * All workout template and meal plan endpoints.
 */
const templatePaths = {
  // ============================================================
  // WORKOUT TEMPLATES
  // ============================================================

  '/templates/workout': {
    get: {
      summary: 'List workout templates',
      description: `
        Returns workout templates with optional filters.
        - **Trainer**: Only their own templates + public templates.
        - **Admin/Reception**: All templates.
        - **Member**: Public templates only.
      `,
      tags: ['Templates'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'trainer_id',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
          description: 'Filter by trainer UUID',
        },
        {
          name: 'goal_type',
          in: 'query',
          schema: {
            type: 'string',
            enum: [
              'weight_loss',
              'muscle_building',
              'endurance',
              'general_fitness',
            ],
          },
          description: 'Filter by goal type',
        },
        {
          name: 'difficulty',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['beginner', 'intermediate', 'advanced'],
          },
          description: 'Filter by difficulty',
        },
        {
          name: 'include_public',
          in: 'query',
          schema: { type: 'boolean', default: true },
          description: 'Include public templates',
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
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
      },
    },
    post: {
      summary: 'Create a workout template',
      description:
        'Creates a new workout template with embedded exercises. Trainer or Admin only.',
      tags: ['Templates'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateWorkoutTemplateRequest',
            },
            example: {
              trainer_id: '550e8400-e29b-41d4-a716-446655440000',
              name: 'Push/Pull/Legs - Beginner',
              description: '3-day split for beginners',
              difficulty: 'beginner',
              goal_type: 'muscle_building',
              duration_weeks: 8,
              is_public: false,
              exercises: [
                {
                  day_number: 1,
                  exercise_name: 'Bench Press',
                  sets: 4,
                  reps_per_set: 10,
                  weight_kg: 60,
                  rest_seconds: 60,
                },
                {
                  day_number: 1,
                  exercise_name: 'Pull-ups',
                  sets: 3,
                  reps_per_set: 8,
                  weight_kg: 0,
                  rest_seconds: 90,
                },
              ],
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Workout template created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    $ref: '#/components/schemas/WorkoutTemplateResponse',
                  },
                  message: { type: 'string' },
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

  '/templates/workout/{id}': {
    get: {
      summary: 'Get workout template by ID',
      description: `
        Returns a single workout template by its MongoDB ID.
        - **Trainer**: Only their own templates + public templates.
        - **Admin/Reception**: Any template.
        - **Member**: Public templates only.
      `,
      tags: ['Templates'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'MongoDB ObjectId of the template',
        },
      ],
      responses: {
        200: {
          description: 'Workout template retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    $ref: '#/components/schemas/WorkoutTemplateResponse',
                  },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Workout template not found' },
      },
    },
    patch: {
      summary: 'Update a workout template',
      description: 'Updates a workout template. Trainer (own) or Admin only.',
      tags: ['Templates'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'MongoDB ObjectId of the template',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateWorkoutTemplateRequest',
            },
            example: {
              name: 'Push/Pull/Legs - Intermediate',
              exercises: [
                {
                  day_number: 1,
                  exercise_name: 'Bench Press',
                  sets: 5,
                  reps_per_set: 8,
                  weight_kg: 80,
                  rest_seconds: 90,
                },
              ],
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Workout template updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    $ref: '#/components/schemas/WorkoutTemplateResponse',
                  },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Workout template not found' },
      },
    },
    delete: {
      summary: 'Delete a workout template',
      description: 'Deletes a workout template. Trainer (own) or Admin only.',
      tags: ['Templates'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'MongoDB ObjectId of the template',
        },
      ],
      responses: {
        200: {
          description: 'Workout template deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: { message: { type: 'string' } },
                  },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Workout template not found' },
      },
    },
  },

  // ============================================================
  // MEAL PLANS
  // ============================================================

  '/templates/meal': {
    get: {
      summary: 'List meal plans',
      description: `
        Returns meal plans with optional filters.
        - **Trainer**: Only their own meal plans.
        - **Admin/Reception**: All meal plans.
        - **Member**: Any trainer's meal plans.
      `,
      tags: ['Templates'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'trainer_id',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
          description: 'Filter by trainer UUID',
        },
        {
          name: 'goal_type',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['weight_loss', 'muscle_building', 'maintenance'],
          },
          description: 'Filter by goal type',
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
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
      },
    },
    post: {
      summary: 'Create a meal plan',
      description:
        'Creates a new meal plan with embedded meal items. Trainer or Admin only.',
      tags: ['Templates'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateMealPlanRequest',
            },
            example: {
              trainer_id: '550e8400-e29b-41d4-a716-446655440000',
              name: 'Weight Loss - 1800 Cal',
              description: 'Balanced meal plan for fat loss',
              goal_type: 'weight_loss',
              calories_target: 1800,
              protein_g: 150,
              carbs_g: 180,
              fat_g: 60,
              items: [
                {
                  day_number: 1,
                  meal_name: 'Breakfast',
                  food_item: 'Oatmeal',
                  quantity: '80g',
                  calories: 300,
                  protein_g: 10,
                  carbs_g: 50,
                  fat_g: 5,
                },
                {
                  day_number: 1,
                  meal_name: 'Lunch',
                  food_item: 'Grilled Chicken Salad',
                  quantity: '200g',
                  calories: 400,
                  protein_g: 40,
                  carbs_g: 20,
                  fat_g: 15,
                },
              ],
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Meal plan created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/MealPlanResponse' },
                  message: { type: 'string' },
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

  '/templates/meal/{id}': {
    get: {
      summary: 'Get meal plan by ID',
      description: 'Returns a single meal plan by its MongoDB ID.',
      tags: ['Templates'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'MongoDB ObjectId of the meal plan',
        },
      ],
      responses: {
        200: {
          description: 'Meal plan retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/MealPlanResponse' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Meal plan not found' },
      },
    },
    patch: {
      summary: 'Update a meal plan',
      description: 'Updates a meal plan. Trainer (own) or Admin only.',
      tags: ['Templates'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'MongoDB ObjectId of the meal plan',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateMealPlanRequest',
            },
            example: {
              name: 'Weight Loss - 2000 Cal',
              items: [
                {
                  day_number: 1,
                  meal_name: 'Breakfast',
                  food_item: 'Oatmeal',
                  quantity: '100g',
                  calories: 350,
                  protein_g: 12,
                  carbs_g: 60,
                  fat_g: 5,
                },
              ],
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Meal plan updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/MealPlanResponse' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Meal plan not found' },
      },
    },
    delete: {
      summary: 'Delete a meal plan',
      description: 'Deletes a meal plan. Trainer (own) or Admin only.',
      tags: ['Templates'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'MongoDB ObjectId of the meal plan',
        },
      ],
      responses: {
        200: {
          description: 'Meal plan deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: { message: { type: 'string' } },
                  },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Meal plan not found' },
      },
    },
  },
};

const templateSchemas = {
  WorkoutTemplateResponse: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      trainer_id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      description: { type: 'string', nullable: true },
      difficulty: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'advanced'],
      },
      goal_type: {
        type: 'string',
        enum: [
          'weight_loss',
          'muscle_building',
          'endurance',
          'general_fitness',
        ],
      },
      duration_weeks: { type: 'integer', nullable: true },
      is_public: { type: 'boolean' },
      exercises: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            day_number: { type: 'integer' },
            exercise_name: { type: 'string' },
            sets: { type: 'integer' },
            reps_per_set: { type: 'integer' },
            weight_kg: { type: 'number' },
            rest_seconds: { type: 'integer' },
            notes: { type: 'string', nullable: true },
          },
        },
      },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  },
  CreateWorkoutTemplateRequest: {
    type: 'object',
    required: ['trainer_id', 'name'],
    properties: {
      trainer_id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      description: { type: 'string' },
      difficulty: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'advanced'],
      },
      goal_type: {
        type: 'string',
        enum: [
          'weight_loss',
          'muscle_building',
          'endurance',
          'general_fitness',
        ],
      },
      duration_weeks: { type: 'integer' },
      is_public: { type: 'boolean' },
      exercises: {
        type: 'array',
        items: {
          type: 'object',
          required: ['day_number', 'exercise_name'],
          properties: {
            day_number: { type: 'integer' },
            exercise_name: { type: 'string' },
            sets: { type: 'integer' },
            reps_per_set: { type: 'integer' },
            weight_kg: { type: 'number' },
            rest_seconds: { type: 'integer' },
            notes: { type: 'string' },
          },
        },
      },
    },
  },
  UpdateWorkoutTemplateRequest: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      difficulty: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'advanced'],
      },
      goal_type: {
        type: 'string',
        enum: [
          'weight_loss',
          'muscle_building',
          'endurance',
          'general_fitness',
        ],
      },
      duration_weeks: { type: 'integer' },
      is_public: { type: 'boolean' },
      exercises: {
        type: 'array',
        items: {
          type: 'object',
          required: ['day_number', 'exercise_name'],
          properties: {
            day_number: { type: 'integer' },
            exercise_name: { type: 'string' },
            sets: { type: 'integer' },
            reps_per_set: { type: 'integer' },
            weight_kg: { type: 'number' },
            rest_seconds: { type: 'integer' },
            notes: { type: 'string' },
          },
        },
      },
    },
  },
  MealPlanResponse: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      trainer_id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      description: { type: 'string', nullable: true },
      goal_type: {
        type: 'string',
        enum: ['weight_loss', 'muscle_building', 'maintenance'],
      },
      calories_target: { type: 'integer', nullable: true },
      protein_g: { type: 'integer', nullable: true },
      carbs_g: { type: 'integer', nullable: true },
      fat_g: { type: 'integer', nullable: true },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            day_number: { type: 'integer' },
            meal_name: {
              type: 'string',
              enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
            },
            food_item: { type: 'string' },
            quantity: { type: 'string', nullable: true },
            calories: { type: 'integer' },
            protein_g: { type: 'integer' },
            carbs_g: { type: 'integer' },
            fat_g: { type: 'integer' },
          },
        },
      },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  },
  CreateMealPlanRequest: {
    type: 'object',
    required: ['trainer_id', 'name'],
    properties: {
      trainer_id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      description: { type: 'string' },
      goal_type: {
        type: 'string',
        enum: ['weight_loss', 'muscle_building', 'maintenance'],
      },
      calories_target: { type: 'integer' },
      protein_g: { type: 'integer' },
      carbs_g: { type: 'integer' },
      fat_g: { type: 'integer' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          required: ['day_number', 'meal_name', 'food_item'],
          properties: {
            day_number: { type: 'integer' },
            meal_name: {
              type: 'string',
              enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
            },
            food_item: { type: 'string' },
            quantity: { type: 'string' },
            calories: { type: 'integer' },
            protein_g: { type: 'integer' },
            carbs_g: { type: 'integer' },
            fat_g: { type: 'integer' },
          },
        },
      },
    },
  },
  UpdateMealPlanRequest: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      goal_type: {
        type: 'string',
        enum: ['weight_loss', 'muscle_building', 'maintenance'],
      },
      calories_target: { type: 'integer' },
      protein_g: { type: 'integer' },
      carbs_g: { type: 'integer' },
      fat_g: { type: 'integer' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          required: ['day_number', 'meal_name', 'food_item'],
          properties: {
            day_number: { type: 'integer' },
            meal_name: {
              type: 'string',
              enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
            },
            food_item: { type: 'string' },
            quantity: { type: 'string' },
            calories: { type: 'integer' },
            protein_g: { type: 'integer' },
            carbs_g: { type: 'integer' },
            fat_g: { type: 'integer' },
          },
        },
      },
    },
  },
};

module.exports = { templatePaths, templateSchemas };
