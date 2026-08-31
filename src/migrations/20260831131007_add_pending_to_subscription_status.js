/**
 * Migration: Add 'pending' to subscription status CHECK constraint
 */
exports.up = async function (knex) {
  // Drop the old constraint
  await knex.raw(
    'ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;',
  );

  // Re-add with 'pending' included
  await knex.raw(`
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check 
    CHECK (status IN ('active', 'frozen', 'expired', 'cancelled', 'pending'));
  `);
};

exports.down = async function (knex) {
  // Rollback: restore the original constraint (without 'pending')
  await knex.raw(
    'ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;',
  );

  await knex.raw(`
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check 
    CHECK (status IN ('active', 'frozen', 'expired', 'cancelled'));
  `);
};
