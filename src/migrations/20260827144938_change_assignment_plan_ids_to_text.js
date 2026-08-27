/**
 * Migration: Change workout_template_id and meal_plan_id to TEXT
 * because they now store MongoDB ObjectIds (not PostgreSQL UUIDs).
 */
exports.up = async function (knex) {
  // Drop foreign key constraints if they exist
  await knex.raw(
    'ALTER TABLE member_assignments DROP CONSTRAINT IF EXISTS member_assignments_workout_template_id_fkey;',
  );
  await knex.raw(
    'ALTER TABLE member_assignments DROP CONSTRAINT IF EXISTS member_assignments_meal_plan_id_fkey;',
  );

  // Change column types from UUID to TEXT
  await knex.raw(
    'ALTER TABLE member_assignments ALTER COLUMN workout_template_id TYPE TEXT;',
  );
  await knex.raw(
    'ALTER TABLE member_assignments ALTER COLUMN meal_plan_id TYPE TEXT;',
  );

  console.log('Changed workout_template_id and meal_plan_id to TEXT');
};

exports.down = async function (knex) {
  // Revert to UUID (but this will fail if there are non-UUID strings, so use with caution)
  await knex.raw(
    'ALTER TABLE member_assignments ALTER COLUMN workout_template_id TYPE UUID USING workout_template_id::uuid;',
  );
  await knex.raw(
    'ALTER TABLE member_assignments ALTER COLUMN meal_plan_id TYPE UUID USING meal_plan_id::uuid;',
  );

  // Re-add foreign key constraints if needed (but they reference tables that may no longer exist)
  // We'll skip re-adding for safety.
  console.log(
    'Rollback: Changed back to UUID (may fail if data is not valid UUID)',
  );
};
