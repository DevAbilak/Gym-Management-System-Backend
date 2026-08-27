/**
 * Migration: Replace full unique constraint with partial unique index
 *
 * The old constraint blocked re-booking after cancellation.
 * The new index only enforces uniqueness for confirmed/waitlisted bookings.
 */
exports.up = async function (knex) {
  // Drop the existing unique constraint
  await knex.raw(
    'ALTER TABLE class_bookings DROP CONSTRAINT IF EXISTS class_bookings_class_id_member_profile_id_key;',
  );

  // Create a partial unique index (only for confirmed/waitlisted)
  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_booking
    ON class_bookings (class_id, member_profile_id)
    WHERE status IN ('confirmed', 'waitlisted');
  `);

  console.log(
    'Dropped full unique constraint, created partial unique index for active bookings.',
  );
};

exports.down = async function (knex) {
  // Drop the partial index
  await knex.raw('DROP INDEX IF EXISTS idx_unique_active_booking;');

  // Re-create the original full unique constraint
  await knex.raw(
    'ALTER TABLE class_bookings ADD CONSTRAINT class_bookings_class_id_member_profile_id_key UNIQUE (class_id, member_profile_id);',
  );

  console.log('Rollback: Restored full unique constraint.');
};
