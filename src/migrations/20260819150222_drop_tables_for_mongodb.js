/**
 * Migration: Drop PostgreSQL Tables (Now Managed by MongoDB)
 *
 * These tables are now handled by MongoDB:
 * - health_metrics
 * - workout_templates
 * - workout_exercises
 * - meal_plans
 * - meal_items
 * - notifications
 *
 * Run: npx knex migrate:up
 * Rollback: npx knex migrate:rollback
 */
exports.up = async function (knex) {
  // Drop tables in reverse order of dependencies (CASCADE handles FKs safely)
  await knex.raw('DROP TABLE IF EXISTS notifications CASCADE;');
  await knex.raw('DROP TABLE IF EXISTS meal_items CASCADE;');
  await knex.raw('DROP TABLE IF EXISTS meal_plans CASCADE;');
  await knex.raw('DROP TABLE IF EXISTS workout_exercises CASCADE;');
  await knex.raw('DROP TABLE IF EXISTS workout_templates CASCADE;');
  await knex.raw('DROP TABLE IF EXISTS health_metrics CASCADE;');

  console.log('Dropped PostgreSQL tables (now using MongoDB):');
  console.log('   - health_metrics');
  console.log('   - workout_templates');
  console.log('   - workout_exercises');
  console.log('   - meal_plans');
  console.log('   - meal_items');
  console.log('   - notifications');
};

/**
 * Rollback: Re-create the tables (if needed)
 * This restores the tables with the original schema (including JSONB columns)
 */
exports.down = async function (knex) {
  // ---------- 1. HEALTH METRICS ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS health_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_profile_id UUID NOT NULL,
      weight_kg DECIMAL(5,2) NOT NULL,
      height_cm DECIMAL(5,2) NOT NULL,
      bmi DECIMAL(4,2),
      data JSONB DEFAULT '{}' NOT NULL,
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_health_metrics_profile ON health_metrics(member_profile_id);
    CREATE INDEX IF NOT EXISTS idx_health_metrics_date ON health_metrics(recorded_at);
  `);
  console.log('Re-created health_metrics table');

  // ---------- 2. WORKOUT TEMPLATES ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS workout_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trainer_id UUID NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
      goal_type VARCHAR(50) CHECK (goal_type IN ('weight_loss', 'muscle_building', 'endurance', 'general_fitness')),
      duration_weeks INTEGER,
      is_public BOOLEAN DEFAULT FALSE,
      exercises JSONB DEFAULT '[]' NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_workout_templates_trainer ON workout_templates(trainer_id);
  `);
  console.log('Re-created workout_templates table');

  // ---------- 3. WORKOUT EXERCISES ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS workout_exercises (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workout_template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
      exercise_name VARCHAR(100) NOT NULL,
      sets INTEGER,
      reps_per_set INTEGER,
      weight_kg DECIMAL(5,2),
      rest_seconds INTEGER,
      day_number INTEGER,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_workout_exercises_template ON workout_exercises(workout_template_id);
  `);
  console.log('Re-created workout_exercises table');

  // ---------- 4. MEAL PLANS ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS meal_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trainer_id UUID NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      goal_type VARCHAR(50) CHECK (goal_type IN ('weight_loss', 'muscle_building', 'maintenance')),
      calories_target INTEGER,
      protein_g INTEGER,
      carbs_g INTEGER,
      fat_g INTEGER,
      items JSONB DEFAULT '[]' NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_meal_plans_trainer ON meal_plans(trainer_id);
  `);
  console.log('Re-created meal_plans table');

  // ---------- 5. MEAL ITEMS ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS meal_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
      meal_name VARCHAR(100) NOT NULL CHECK (meal_name IN ('Breakfast', 'Lunch', 'Dinner', 'Snack')),
      food_item VARCHAR(100) NOT NULL,
      quantity VARCHAR(50),
      calories INTEGER,
      protein_g INTEGER,
      carbs_g INTEGER,
      fat_g INTEGER,
      day_number INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_meal_items_plan ON meal_items(meal_plan_id);
  `);
  console.log('Re-created meal_items table');

  // ---------- 6. NOTIFICATIONS ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      read_at TIMESTAMPTZ,
      priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
      data JSONB DEFAULT '{}' NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(created_at);
  `);
  console.log('Re-created notifications table');

  console.log('Rollback complete — all tables restored (with JSONB columns)');
};
