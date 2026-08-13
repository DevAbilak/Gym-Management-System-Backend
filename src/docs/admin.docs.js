const adminPaths = {
  '/admin/register': {
    post: {
      summary: 'Admin: Register any user',
      description:
        'Creates a user account with any role (member, trainer, reception). Admin-only endpoint.',
      tags: ['Admin'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AdminRegistrationRequest',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'User registered successfully',
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: '#/components/schemas/MemberRegistrationResponse' },
                  { $ref: '#/components/schemas/TrainerRegistrationResponse' },
                  { $ref: '#/components/schemas/UserRegistrationResponse' },
                ],
              },
            },
          },
        },
        400: {
          description: 'Validation error or missing fields',
        },
        403: {
          description: 'Insufficient permissions (not admin)',
        },
        401: {
          description: 'Unauthenticated (missing or invalid token)',
        },
      },
    },
  },
};

const adminSchemas = {
  AdminRegistrationRequest: {
    type: 'object',
    required: ['email', 'password', 'first_name', 'last_name', 'role'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'reception@fitaddis.com',
      },
      password: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'SecurePass123!',
      },
      first_name: { type: 'string', example: 'Sarah' },
      last_name: { type: 'string', example: 'Johnson' },
      phone: { type: 'string', example: '+251 9 11 22-33-44' },
      role: {
        type: 'string',
        enum: ['member', 'trainer', 'reception'],
        description: 'Any role can be assigned by admin',
        example: 'reception',
      },
    },
  },
};

module.exports = { adminPaths, adminSchemas };
