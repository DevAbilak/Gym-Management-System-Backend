const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    day_number: {
      type: Number,
      required: [true, 'Day number is required'],
      min: 1,
    },
    exercise_name: {
      type: String,
      required: [true, 'Exercise name is required'],
    },
    sets: {
      type: Number,
      default: 0,
      min: 0,
    },
    reps_per_set: {
      type: Number,
      default: 0,
      min: 0,
    },
    weight_kg: {
      type: Number,
      default: 0,
      min: 0,
    },
    rest_seconds: {
      type: Number,
      default: 60,
      min: 0,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  {
    _id: false, // prevent auto generating _id for sub-documents
  },
);

const workoutTemplateSchema = new mongoose.Schema(
  {
    trainer_id: {
      type: String,
      required: [true, 'trainer_id (PostgreSQL UUID) is required'],
      index: true,
      description: 'References trainers.id in PostgreSQL',
    },
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    goal_type: {
      type: String,
      enum: ['weight_loss', 'muscle_building', 'endurance', 'general_fitness'],
      default: 'general_fitness',
    },
    duration_weeks: {
      type: Number,
      default: null,
      min: 1,
    },
    is_public: {
      type: Boolean,
      default: false,
    },
    exercises: {
      type: [exerciseSchema],
      default: [],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

// Index for trainer lookups and public templates
workoutTemplateSchema.index({ trainer_id: 1, is_public: 1 });
workoutTemplateSchema.index({ goal_type: 1 });

module.exports = mongoose.model('WorkoutTemplate', workoutTemplateSchema);
