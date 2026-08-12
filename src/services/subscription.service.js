const knex = require('../db/db');

const createSubscription = async (payload) => {
  const { member_profile_id, membership_tier_id, start_date, auto_renew } =
    payload;

  const start = start_date || new Date().toISOString().split('T')[0];

  const result = await knex.raw(
    `
    INSERT INTO subscriptions (
      member_profile_id, membership_tier_id, status, start_date, expiry_date, auto_renew
    ) VALUES (?,?, 'active', ?, ? + INTERVAL '30 days', ?)
    RETURNING *
  `,
    [member_profile_id, membership_tier_id, start, start, auto_renew || false],
  );

  return result.rows[0];
};

const updateSubscriptionStatus = async (subscriptionId, newStatus) => {
  const validStatus = ['active', 'expired', 'frozen', 'cancelled'];

  if (!validStatus.includes(newStatus)) {
    throw new Error('Invalid subscription status');
  }

  let query = `
    UPDATE subscriptions 
    SET status = ?, updated_at = NOW()
    WHERE id = ?
    RETURNING * 
  `;

  let params = [newStatus, subscriptionId];

  if (newStatus == 'frozen') {
    query = `
      UPDATE subscriptions 
      SET status = ?, frozen_until = CURRENT_DATE + INTERVAL '30days', updated_at = NOW()
      WHERE id = ?
      RETURNING * 
    `;
  }

  const result = await knex.raw(query, params);
  return result.rows[0];
};

const getSubscriptionById = async (id) => {
  const result = await knex.raw('SELECT * FROM subscriptions WHERE id = ?', [
    id,
  ]);
  return result.rows[0];
};

const getActiveSubscription = async (memberProfileId) => {
  const result = await knex.raw(
    `
    SELECT s.*, t.name as tier_name, t.price_monthly
    FROM subscriptions s
    JOIN membership_tiers t ON s.membership_tier_id = id
    WHERE s.membership_profile_id = ? AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1
  `,
    [memberProfileId],
  );

  return result.rows[0];
};

module.exports = {
  createSubscription,
  updateSubscriptionStatus,
  getSubscriptionById,
  getActiveSubscription,
};
