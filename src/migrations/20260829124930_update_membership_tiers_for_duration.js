/**
 * Migration: Update membership_tiers for flexible duration pricing
 *
 * Replaces price_monthly and price_annual with:
 * - duration_months (INTEGER): How many months this tier lasts
 * - price (DECIMAL): The total price for that duration
 */
exports.up = async function (knex) {
  // 1. Drop the existing CHECK constraint on name (so we can use any name)
  await knex.raw(
    'ALTER TABLE membership_tiers DROP CONSTRAINT IF EXISTS membership_tiers_name_check;',
  );

  // 2. Add new columns
  await knex.raw(
    'ALTER TABLE membership_tiers ADD COLUMN IF NOT EXISTS duration_months INTEGER;',
  );
  await knex.raw(
    'ALTER TABLE membership_tiers ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);',
  );

  // 3. Drop old columns
  await knex.raw(
    'ALTER TABLE membership_tiers DROP COLUMN IF EXISTS price_monthly;',
  );
  await knex.raw(
    'ALTER TABLE membership_tiers DROP COLUMN IF EXISTS price_annual;',
  );

  console.log(
    'Updated membership_tiers: dropped name constraint, added duration_months + price, dropped old price columns.',
  );
};

exports.down = async function (knex) {
  // Rollback: restore old columns, drop new ones
  await knex.raw(
    'ALTER TABLE membership_tiers ADD COLUMN IF NOT EXISTS price_monthly DECIMAL(10,2);',
  );
  await knex.raw(
    'ALTER TABLE membership_tiers ADD COLUMN IF NOT EXISTS price_annual DECIMAL(10,2);',
  );
  await knex.raw(
    'ALTER TABLE membership_tiers DROP COLUMN IF EXISTS duration_months;',
  );
  await knex.raw('ALTER TABLE membership_tiers DROP COLUMN IF EXISTS price;');

  // Re-add the CHECK constraint (basic restore, if needed)
  await knex.raw(
    'ALTER TABLE membership_tiers ADD CONSTRAINT membership_tiers_name_check CHECK (name IN (\'Basic\', \'Premium\', \'VIP\'));',
  );

  console.log(
    'Rollback: Restored price_monthly, price_annual, and CHECK constraint.',
  );
};
