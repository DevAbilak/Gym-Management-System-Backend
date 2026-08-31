const knex = require('../db/db');
const { invalidateKpiCache } = require('./admin.service');
const { redisClient } = require('../config/redis');
const { createTransaction } = require('./payment.service');

// Direct creation for admin/reception only in case of cash payment
const createSubscription = async (payload) => {
  const { member_profile_id, membership_tier_id, start_date, auto_renew } =
    payload;
  const start = start_date || new Date().toISOString().split('T')[0];

  // Get tier duration to calculate expiry
  const tierResult = await knex.raw(
    `
    SELECT duration_months FROM membership_tiers WHERE id = ? AND is_active = true
  `,
    [membership_tier_id],
  );
  if (tierResult.rows.length === 0) {
    throw new Error('Invalid or inactive membership tier');
  }

  const durationMonths = tierResult.rows[0].duration_months;

  // calculate expiry
  const expiryDate = new Date(start);
  expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

  // insert as active
  const result = await knex.raw(
    `
    INSERT INTO subscriptions (
      member_profile_id, membership_tier_id, status, start_date, expiry_date, auto_renew
    ) VALUES (?,?, 'active', ?, ?, ?)
    RETURNING *
  `,
    [
      member_profile_id,
      membership_tier_id,
      start,
      expiryDate.toISOString().split('T')[0],
      auto_renew || false,
    ],
  );

  await invalidateKpiCache();

  return result.rows[0];
};

// Payment powered creation
const createPendingSubscription = async (payload) => {
  const { member_profile_id, membership_tier_id, start_date, auto_renew } =
    payload;
  const start = start_date || new Date().toISOString().split('T')[0];

  // check if member already has an active subscription
  const existing = await knex.raw(
    `
    SELECT id FROM subscriptions WHERE member_profile_id = ? AND status = 'active'
  `,
    [member_profile_id],
  );
  if (existing.rows.length > 0) {
    throw new Error('Member already has an active subscription');
  }

  // fetch member to get email, name, phone for the payment gateway
  const memberResult = await knex.raw(
    `
    SELECT u.email, u.first_name,u.last_name,u.phone
    FROM member_profiles mp
    JOIN users u ON mp.user_id = u.id
    WHERE mp.id = ?
  `,
    [member_profile_id],
  );

  const member = memberResult.rows[0];
  if (!member) {
    throw new Error('Member not found');
  }

  // fetch tier to get price and duration for the selected plan
  const tierResult = await knex.raw(
    `
    SELECT duration_months,price,name
    FROM membership_tiers 
    WHERE id = ? AND is_active = true
  `,
    [membership_tier_id],
  );

  const tier = tierResult.rows[0];
  if (!tier) {
    throw new Error('Invalid membership tier');
  }

  // calculate expiry
  const expiry = new Date(start);
  expiry.setMonth(expiry.getMonth() + tier.duration_months);

  // create pending subscription in db
  const subscriptionResult = await knex.raw(
    `
    INSERT INTO subscriptions (
      member_profile_id, membership_tier_id, status, start_date, expiry_date, auto_renew
    ) VALUES (?,?,'pending',?,?,?)
     RETURNING *
  `,
    [
      member_profile_id,
      membership_tier_id,
      start,
      expiry.toISOString().split('T')[0],
      auto_renew || false,
    ],
  );

  const subscription = subscriptionResult.rows[0];

  const price = parseFloat(tier.price);

  // prepare starpay payload
  const items = [
    {
      productId: membership_tier_id,
      quantity: 1,
      item_name: tier.name,
      unit_price: price,
    },
  ];

  const metadata = {
    subscription_id: subscription.id,
    member_profile_id,
  };

  // initiate payment with starpay
  const payment = await createTransaction({
    amount: price,
    description: `Gym Membership - ${tier.name}`,
    customerName: `${member.first_name} ${member.last_name}`,
    customerPhoneNumber: member.phone || '+251900000000',
    customerEmail: member.email,
    items,
    metadata,
  });
  console.log(payment);

  // store mapping in redis
  await redisClient.set(
    `payment:${payment.billRefNo}`,
    JSON.stringify({ subscription_id: subscription.id }),
    'EX',
    3600 * 24, // 24 hours
  );

  return {
    subscription,
    payment: {
      billRefNo: payment.billRefNo,
      paymentUrl: payment.paymentUrl,
    },
  };
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

  await invalidateKpiCache();
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
    SELECT s.*, t.name AS tier_name, t.price, t.duration_months
    FROM subscriptions s
    JOIN membership_tiers t ON s.membership_tier_id = t.id
    WHERE s.member_profile_id = ? AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1
    `,
    [memberProfileId],
  );

  return result.rows[0];
};

const getSubscriptionByMember = async (
  memberProfileId,
  page = 1,
  limit = 20,
) => {
  const offset = (page - 1) * limit;

  const dataResult = await knex.raw(
    `
        SELECT 
          s.*,
          t.name AS tier_name,
          t.price,
          t.duration_months
        FROM subscriptions s
        JOIN membership_tiers t ON s.membership_tier_id = t.id
        WHERE s.member_profile_id = ?
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?  
      `,
    [memberProfileId, limit, offset],
  );

  const countResult = await knex.raw(
    `
        SELECT COUNT(*) as total
        FROM subscriptions
        WHERE member_profile_id = ?
      `,
    [memberProfileId],
  );
  const total = parseInt(countResult.rows[0]?.total || 0);

  return {
    data: dataResult.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  createSubscription,
  createPendingSubscription,
  updateSubscriptionStatus,
  getSubscriptionById,
  getActiveSubscription,
  getSubscriptionByMember,
};
