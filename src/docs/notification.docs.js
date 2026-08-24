/**
 * Notification API Documentation (OpenAPI)
 *
 * All in-app notification endpoints.
 */
const notificationPaths = {
  // ============================================================
  // GET CURRENT USER'S NOTIFICATIONS
  // ============================================================
  '/notifications': {
    get: {
      summary: 'Get current user\'s notifications',
      description: `
        Returns paginated notifications for the authenticated user.
        - All authenticated users (Member, Trainer, Admin, Reception) can access their own.
      `,
      tags: ['Notifications'],
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
      ],
      responses: {
        200: {
          description: 'Notifications retrieved successfully',
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
                          $ref: '#/components/schemas/NotificationResponse',
                        },
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          limit: { type: 'integer' },
                          skip: { type: 'integer' },
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
      },
    },
  },

  // ============================================================
  // GET UNREAD COUNT
  // ============================================================
  '/notifications/unread': {
    get: {
      summary: 'Get unread notification count',
      description:
        'Returns the number of unread notifications for the authenticated user.',
      tags: ['Notifications'],
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Unread count retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      unread_count: { type: 'integer' },
                    },
                  },
                  message: { type: 'string' },
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
  // MARK NOTIFICATION AS READ
  // ============================================================
  '/notifications/{id}/read': {
    patch: {
      summary: 'Mark a notification as read',
      description: `
        Marks a single notification as read.
        - **Member/Trainer**: Only their own notifications.
        - **Admin/Reception**: Any notification.
      `,
      tags: ['Notifications'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'MongoDB ObjectId of the notification',
        },
      ],
      responses: {
        200: {
          description: 'Notification marked as read',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/NotificationResponse' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Notification not found' },
      },
    },
  },

  // ============================================================
  // MARK ALL AS READ
  // ============================================================
  '/notifications/read-all': {
    patch: {
      summary: 'Mark all notifications as read',
      description:
        'Marks all unread notifications as read for the authenticated user.',
      tags: ['Notifications'],
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'All notifications marked as read',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                    },
                  },
                  message: { type: 'string' },
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
  // DELETE A NOTIFICATION
  // ============================================================
  '/notifications/{id}': {
    delete: {
      summary: 'Delete a notification',
      description: `
        Deletes a notification.
        - **Member/Trainer**: Only their own notifications.
        - **Admin/Reception**: Any notification.
      `,
      tags: ['Notifications'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'MongoDB ObjectId of the notification',
        },
      ],
      responses: {
        200: {
          description: 'Notification deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
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
        404: { description: 'Notification not found' },
      },
    },
  },

  // ============================================================
  // GET USER NOTIFICATIONS (Admin/Reception only)
  // ============================================================
  '/notifications/user/{userId}': {
    get: {
      summary: 'Get notifications for a specific user (Admin/Reception only)',
      description:
        'Returns paginated notifications for a specific user. Admin/Reception only.',
      tags: ['Notifications'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'PostgreSQL UUID of the user',
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
          description: 'User notifications retrieved successfully',
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
                          $ref: '#/components/schemas/NotificationResponse',
                        },
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          limit: { type: 'integer' },
                          skip: { type: 'integer' },
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
        403: { description: 'Forbidden (insufficient permissions)' },
        404: { description: 'User not found' },
      },
    },
  },
};

const notificationSchemas = {
  NotificationResponse: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      user_id: { type: 'string', format: 'uuid' },
      type: {
        type: 'string',
        enum: [
          'booking_confirmed',
          'booking_cancelled',
          'plan_assigned',
          'payment_reminder',
          'class_reminder',
          'system',
        ],
      },
      title: { type: 'string' },
      message: { type: 'string' },
      link: { type: 'string', nullable: true },
      is_read: { type: 'boolean' },
      read_at: { type: 'string', format: 'date-time', nullable: true },
      priority: { type: 'string', enum: ['low', 'normal', 'high'] },
      data: { type: 'object', nullable: true },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  },
};

module.exports = { notificationPaths, notificationSchemas };
