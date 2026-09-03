/**
 * Migration: Add 'waitlisted' to class_bookings status CHECK constraint
 */
exports.up = async function (knex) {
  // Drop the old constraint
  await knex.raw(`
    ALTER TABLE class_bookings 
    DROP CONSTRAINT IF EXISTS class_bookings_status_check;
  `);

  // Re-add with 'waitlisted' included
  await knex.raw(`
    ALTER TABLE class_bookings 
    ADD CONSTRAINT class_bookings_status_check
    CHECK (status IN ('confirmed', 'cancelled', 'attended', 'no_show', 'waitlisted'));
  `);

  console.log('Added waitlisted to booking status constraint');
};

exports.down = async function (knex) {
  await knex.raw(`
    ALTER TABLE class_bookings 
    DROP CONSTRAINT IF EXISTS class_bookings_status_check;
  `);

  await knex.raw(`
    ALTER TABLE class_bookings 
    ADD CONSTRAINT class_bookings_status_check
    CHECK (status IN ('confirmed', 'cancelled', 'attended', 'no_show'));
  `);

  console.log('Rollback: removed waitlisted from booking status constraint');
};
