const mongoose = require('mongoose');

const healthMetricSchema = new mongoose.Schema(
  {
    member_id: {
      type: String,
      required: [true, 'member_id (PostgreSQL UUID) is required'],
      index: true,
      description: 'References member_profiles.id in PostgreSQL',
    },
    height_cm: {
      type: Number,
      required: [true, 'Height in cm is required'],
      min: 0,
    },
    bmi: {
      type: Number,
      min: 0,
      description: 'Calculated automatically: weight / (height/100)^2',
    },
    blood_type: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      default: null,
    },
    dietary_restrictions: {
      type: String,
      default: null,
    },
    body_fat_percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    muscle_mass_kg: {
      type: Number,
      min: 0,
      default: null,
    },
    waist_cm: {
      type: Number,
      min: 0,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    recorded_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

// Compound index for fast time-series queries per member
healthMetricSchema.index({ member_id: 1, recorded_at: -1 });
module.exports = mongoose.model('HealthMetric', healthMetricSchema);
