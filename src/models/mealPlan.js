const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema(
  {
    day_number: {
      type: Number,
      required: [true, 'Day number is required'],
      min: 1,
    },
    meal_name: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
      required: [true, 'Meal name is required'],
    },
    food_item: {
      type: String,
      required: [true, 'Food item is required'],
    },
    quantity: {
      type: String,
      default: null,
    },
    calories: {
      type: Number,
      default: 0,
      min: 0,
    },
    protein_g: {
      type: Number,
      default: 0,
      min: 0,
    },
    carbs_g: {
      type: Number,
      default: 0,
      min: 0,
    },
    fat_g: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false },
);

const mealPlanSchema = new mongoose.Schema(
  {
    trainer_id: {
      type: String,
      required: [true, 'trainer_id (PostgreSQL UUID) is required'],
      description: 'References trainers.id in PostgreSQL',
    },
    name: {
      type: String,
      required: [true, 'Meal plan name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    goal_type: {
      type: String,
      enum: ['weight_loss', 'muscle_building', 'maintenance'],
      default: 'maintenance',
    },
    calories_target: {
      type: Number,
      default: null,
      min: 0,
    },
    protein_g: {
      type: Number,
      default: null,
      min: 0,
    },
    carbs_g: {
      type: Number,
      default: null,
      min: 0,
    },
    fat_g: {
      type: Number,
      default: null,
      min: 0,
    },
    items: {
      type: [mealItemSchema],
      default: [],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

mealPlanSchema.index({ trainer_id: 1 });
mealPlanSchema.index({ goal_type: 1 });

module.exports = mongoose.model('MealPlan', mealPlanSchema);
