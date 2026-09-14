const knex = require("../../src/db/db");

const createMembershipTier = async () => {
  const tier1 = await knex.raw(
    `
    INSERT INTO membership_tiers (
      name, description, duration_months, price,max_classes_per_week, includes_trainer,includes_nutrition_plan, is_active
    ) VALUES (?,?,?,?,?,?,?,?)
    RETURNING id
  `,
    [
      "Basic Monthly",
      "Access to gym floor and basic equipment.",
      1,
      50.0,
      0,
      false,
      false,
      true,
    ],
  );
  const tierId1 = tier1.rows[0].id;

  const tier2 = await knex.raw(
    `
    INSERT INTO membership_tiers (
      name, description, duration_months, price,max_classes_per_week, includes_trainer,includes_nutrition_plan, is_active
    ) VALUES (?,?,?,?,?,?,?,?)
    RETURNING id
  `,
    [
      "Premium Monthly",
      "Unlimited classes + personal trainer access.",
      1,
      80.0,
      0,
      true,
      true,
      true,
    ],
  );

  const tierId2 = tier2.rows[0].id;

  const tier3 = await knex.raw(
    `
    INSERT INTO membership_tiers (
      name, description, duration_months, price,max_classes_per_week, includes_trainer,includes_nutrition_plan, is_active
    ) VALUES (?,?,?,?,?,?,?,?)
    RETURNING id
  `,
    [
      "Premium Yearly",
      "Unlimited classes + personal trainer access.",
      1,
      80.0,
      0,
      true,
      true,
      false,
    ],
  );

  const tierId3 = tier3.rows[0].id;

  return { tierId1, tierId2, tierId3 };
};

module.exports = { createMembershipTier };
