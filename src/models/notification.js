const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: [true, 'user_id (PostgreSQL UUID) is required'],
      description: 'References users.id in PostgreSQL',
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: [
        'booking_confirmed',
        'booking_cancelled',
        'plan_assigned',
        'payment_reminder',
        'class_reminder',
        'system',
      ],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 255,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    link: {
      type: String,
      default: null,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    read_at: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      description: 'Flexible payload (deep links, metadata, etc.)',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

// Compound indexes for efficient queries
notificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });
notificationSchema.index({ user_id: 1, created_at: -1 });
notificationSchema.index({ is_read: 1, created_at: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
