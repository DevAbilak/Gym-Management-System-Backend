/**
 * Booking API Documentation (OpenAPI)
 *
 * All booking-related endpoints.
 */
const bookingPaths = {
  // ============================================================
  // BOOK A CLASS
  // ============================================================
  '/bookings': {
    post: {
      summary: 'Book a class',
      description: `
        Books a class for a member.
        - **Member**: Can only book for themselves.
        - **Admin/Reception**: Can book for any member.
        - **Trainer**: Cannot book.
      `,
      tags: ['Bookings'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateBookingRequest',
            },
            example: {
              member_profile_id: '550e8400-e29b-41d4-a716-446655440000',
              class_id: '550e8400-e29b-41d4-a716-446655440001',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Booking successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      status: {
                        type: 'string',
                        enum: ['confirmed', 'waitlisted'],
                      },
                      message: { type: 'string' },
                      class: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          name: { type: 'string' },
                          current_bookings: { type: 'integer' },
                          capacity: { type: 'integer' },
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
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Member or class not found' },
        409: { description: 'Booking conflict (already booked or class full)' },
      },
    },
  },

  // ============================================================
  // GET BOOKING BY ID
  // ============================================================
  '/bookings/{id}': {
    get: {
      summary: 'Get booking by ID',
      description: `
        Returns a single booking by UUID.
        - **Member**: Only their own bookings.
        - **Admin/Reception**: Any booking.
        - **Trainer**: Only assigned members booking.
      `,
      tags: ['Bookings'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Booking UUID',
        },
      ],
      responses: {
        200: {
          description: 'Booking retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/BookingResponse' },
                  message: {
                    type: 'string',
                    example: 'Booking retrieved successfully',
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Booking not found' },
      },
    },
    // ============================================================
    // CANCEL A BOOKING
    // ============================================================
    delete: {
      summary: 'Cancel a booking',
      description: `
        Cancels a booking and auto-promotes the oldest waitlisted member (if any).
        - **Member**: Only their own bookings.
        - **Admin/Reception**: Any booking.
        - **Trainer**: Cannot cancel.
      `,
      tags: ['Bookings'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Booking UUID',
        },
      ],
      responses: {
        200: {
          description: 'Booking cancelled successfully',
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
                  message: {
                    type: 'string',
                    example: 'Booking cancelled successfully',
                  },
                },
              },
            },
          },
        },
        400: { description: 'Cancellation window violation' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Booking not found' },
        409: { description: 'Booking already cancelled' },
      },
    },
  },

  // ============================================================
  // RESCHEDULE A BOOKING
  // ============================================================
  '/bookings/{id}/reschedule': {
    post: {
      summary: 'Reschedule a booking',
      description: `
        Moves a booking to a different class.
        - **Member**: Only their own bookings.
        - **Admin/Reception**: Any booking.
        - **Trainer**: Cannot reschedule.
      `,
      tags: ['Bookings'],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Booking UUID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['new_class_id'],
              properties: {
                new_class_id: {
                  type: 'string',
                  format: 'uuid',
                  description: 'UUID of the target class',
                },
              },
            },
            example: {
              new_class_id: '550e8400-e29b-41d4-a716-446655440002',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Booking rescheduled successfully',
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
                  message: {
                    type: 'string',
                    example: 'Booking rescheduled successfully',
                  },
                },
              },
            },
          },
        },
        400: { description: 'Validation error or policy violation' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Booking or target class not found' },
        409: {
          description: 'Target class is full or booking already cancelled',
        },
      },
    },
  },

  // ============================================================
  // GET MEMBER'S BOOKING HISTORY
  // ============================================================
  '/bookings/member/{memberProfileId}': {
    get: {
      summary: 'Get member\'s booking history',
      description: `
        Returns all bookings for a member.
        - **Member**: Only their own history.
        - **Admin/Reception**: Any member's history.
        - **Trainer**: Only their assigned members booking history.
      `,
      tags: ['Bookings'],
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
          description: 'Booking history retrieved successfully',
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
                      bookings: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/BookingResponse' },
                      },
                    },
                  },
                  message: {
                    type: 'string',
                    example: 'Booking history retrieved successfully',
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
};

const bookingSchemas = {
  CreateBookingRequest: {
    type: 'object',
    required: ['member_profile_id', 'class_id'],
    properties: {
      member_profile_id: {
        type: 'string',
        format: 'uuid',
        description: 'UUID of the member profile',
      },
      class_id: {
        type: 'string',
        format: 'uuid',
        description: 'UUID of the class to book',
      },
    },
  },

  BookingResponse: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      booking_reference: { type: 'string' },
      status: {
        type: 'string',
        enum: ['confirmed', 'waitlisted', 'cancelled', 'attended', 'no_show'],
      },
      booked_at: { type: 'string', format: 'date-time' },
      cancelled_at: { type: 'string', format: 'date-time', nullable: true },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
      class_id: { type: 'string', format: 'uuid' },
      class_name: { type: 'string' },
      start_time: { type: 'string', format: 'date-time' },
      end_time: { type: 'string', format: 'date-time' },
      location: { type: 'string' },
      trainer_name: { type: 'string' },
      member_profile_id: { type: 'string', format: 'uuid' },
    },
  },
};

module.exports = { bookingPaths, bookingSchemas };
