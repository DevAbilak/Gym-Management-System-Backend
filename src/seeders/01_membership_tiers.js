/**
 * Seed: Membership Tiers (Time-based packages)
 *
 * Example packages with varying durations and prices.
 */
exports.seed = async function (knex) {
  // Delete existing entries (if any)
  await knex('membership_tiers').del();

  // Insert new packages
  await knex('membership_tiers').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Basic Monthly',
      description: 'Access to gym floor and basic equipment.',
      duration_months: 1,
      price: 50.0,
      max_classes_per_week: 0,
      includes_trainer: false,
      includes_nutrition_plan: false,
      is_active: true,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Basic 6-Month',
      description: 'Access to gym floor (6-month commitment, save 20%).',
      duration_months: 6,
      price: 240.0, // 40/month (saves 60 total)
      max_classes_per_week: 0,
      includes_trainer: false,
      includes_nutrition_plan: false,
      is_active: true,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Basic Yearly',
      description: 'Access to gym floor (1-year commitment, save 30%).',
      duration_months: 12,
      price: 420.0, // 35/month (saves 180 total)
      max_classes_per_week: 0,
      includes_trainer: false,
      includes_nutrition_plan: false,
      is_active: true,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Premium Monthly',
      description: 'Unlimited classes + personal trainer access.',
      duration_months: 1,
      price: 80.0,
      max_classes_per_week: 0, // unlimited
      includes_trainer: true,
      includes_nutrition_plan: true,
      is_active: true,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Premium 6-Month',
      description: 'Unlimited classes + trainer (save 12%).',
      duration_months: 6,
      price: 420.0, // 70/month
      max_classes_per_week: 0,
      includes_trainer: true,
      includes_nutrition_plan: true,
      is_active: true,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Premium Yearly',
      description: 'Ultimate package (save 25%).',
      duration_months: 12,
      price: 720.0, // 60/month
      max_classes_per_week: 0,
      includes_trainer: true,
      includes_nutrition_plan: true,
      is_active: true,
    },
  ]);

  console.log('Seeded membership_tiers with time-based packages.');
};
