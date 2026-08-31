/**
 * Migration: Add 'starpay' to invoices payment_method CHECK constraint and remove 'chapa'
 */
exports.up = async function (knex) {
  // Drop the old constraint
  await knex.raw(
    'ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_method_check;',
  );

  // Re-add with 'starpay' included
  await knex.raw(`
    ALTER TABLE invoices ADD CONSTRAINT invoices_payment_method_check 
    CHECK (payment_method IN ('telebirr', 'cash', 'starpay'));
  `);
};

exports.down = async function (knex) {
  // Rollback: restore the original constraint (without 'starpay')
  await knex.raw(
    'ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_method_check;',
  );

  await knex.raw(`
    ALTER TABLE invoices ADD CONSTRAINT invoices_payment_method_check 
    CHECK (payment_method IN ('chapa', 'telebirr', 'cash'));
  `);
};
