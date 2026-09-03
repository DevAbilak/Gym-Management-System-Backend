const knex = require("../../src/db/db");

//  Create a member profile with a unique ID
const createMemberProfile = async (userId, overrides = {}) => {
  const uniqueMemberId = `GYM-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(Math.random() * 10)}`;
  const result = await knex.raw(
    `
    INSERT INTO member_profiles (
      user_id, unique_member_id, date_of_birth, gender, fitness_goal,
      emergency_contact_name, emergency_contact_phone
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING id, unique_member_id
    `,
    [
      userId,
      uniqueMemberId,
      overrides.date_of_birth || "1996-01-01",
      overrides.gender || "male",
      overrides.fitness_goal || "muscle_building",
      overrides.emergency_contact_name || "Jane Doe",
      overrides.emergency_contact_phone || "+251911111111",
    ],
  );
  return result.rows[0];
};

// Create a subscription for a member
const createSubscription = async (memberProfileId, status = "active") => {
  // Get a tier
  let tierResult = await knex.raw(`SELECT id FROM membership_tiers LIMIT 1`);
  if (tierResult.rows.length === 0) {
    // Insert a default tier
    await knex.raw(
      `
      INSERT INTO membership_tiers (name, duration_months, price, is_active)
      VALUES ('Test Tier', 1, 100, true)
      `,
    );
    tierResult = await knex.raw(`SELECT id FROM membership_tiers LIMIT 1`);
  }
  const tierId = tierResult.rows[0].id;

  const result = await knex.raw(
    `
    INSERT INTO subscriptions (
      member_profile_id, membership_tier_id, status, start_date, expiry_date
    ) VALUES (?, ?, ?, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days')
    RETURNING id
    `,
    [memberProfileId, tierId, status],
  );
  return result.rows[0].id;
};

module.exports = {
  createMemberProfile,
  createSubscription,
};
