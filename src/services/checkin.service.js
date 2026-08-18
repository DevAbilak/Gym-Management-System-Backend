const knex = require('../db/db');
const { redisClient } = require('../config/redis');

const CACHE_TTL = 300; // 5 minutes

// GET MEMBER BY UNIQUE MEMBER ID
const getMemberByUniqueId = async (uniqueId) => {
  // 1. Check Redis cache
  const cached = await redisClient.get(`member:${uniqueId}`);

  if (cached) {
    return JSON.parse(cached);
  }

  // 2. Cache miss -> get member from PostgreSQL
  const result = await knex.raw(
    `
    SELECT 
      mp.id,
      mp.unique_member_id,
      mp.user_id,
      mp.date_of_birth,
      mp.gender,
      mp.fitness_goal,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      u.is_active,
      s.status AS subscription_status,
      s.expiry_date
    FROM member_profiles mp
    JOIN users u ON mp.user_id = u.id
    LEFT JOIN subscriptions s
      ON s.member_profile_id = mp.id
      AND s.status = 'active'
    WHERE mp.unique_member_id = ?
    `,
    [uniqueId],
  );

  const member = result.rows[0];

  // 3. Store member in Redis
  if (member) {
    await redisClient.set(
      `member:${uniqueId}`,
      JSON.stringify(member),
      'EX',
      CACHE_TTL,
    );
  }

  return member;
};

// CHECK IN
const checkIn = async (uniqueId, verifiedBy = null) => {
  const member = await getMemberByUniqueId(uniqueId);

  if (!member) {
    throw new Error('Member not found');
  }

  if (!member.is_active) {
    throw new Error('Account is deactivated');
  }

  // Check active subscription
  if (member.subscription_status !== 'active') {
    throw new Error('Member does not have an active subscription');
  }

  // Record check-in
  const result = await knex.raw(
    `
    INSERT INTO attendance_records (
      member_profile_id,
      check_in_type,
      checked_in_at,
      verified_by
    )
    VALUES (?, 'gym_entry', NOW(), ?)
    RETURNING *
    `,
    [member.id, verifiedBy],
  );

  // Invalidate cached member data
  await redisClient.del(`member:${uniqueId}`);

  return {
    member: {
      id: member.id,
      unique_member_id: member.unique_member_id,
      full_name: `${member.first_name} ${member.last_name}`,
      email: member.email,
    },
    checkin: result.rows[0],
    status: 'success',
  };
};

// OVERRIDE CHECK IN
const overRideCheckIn = async (uniqueId, reason, verifiedBy) => {
  const member = await getMemberByUniqueId(uniqueId);

  if (!member) {
    throw new Error('Member not found');
  }

  const result = await knex.raw(
    `
    INSERT INTO attendance_records (
      member_profile_id,
      check_in_type,
      checked_in_at,
      verified_by,
      notes
    )
    VALUES (?, 'gym_entry', NOW(), ?, ?)
    RETURNING *
    `,
    [member.id, verifiedBy, `OVERRIDE: ${reason}`],
  );

  // Invalidate cache
  await redisClient.del(`member:${uniqueId}`);

  return {
    member: {
      id: member.id,
      unique_member_id: member.unique_member_id,
      full_name: `${member.first_name} ${member.last_name}`,
      email: member.email,
    },
    checkin: result.rows[0],
    override: true,
    reason,
  };
};

// GET MEMBER CHECK-IN HISTORY
const getCheckInHistory = async (memberId, limit = 50) => {
  const result = await knex.raw(
    `
    SELECT
      id,
      check_in_type,
      checked_in_at,
      checked_out_at,
      notes,
      verified_by
    FROM attendance_records
    WHERE member_profile_id = ?
    ORDER BY checked_in_at DESC
    LIMIT ?
    `,
    [memberId, limit],
  );

  return result.rows;
};

// GET TODAY'S CHECK-INS
const getTodayCheckIns = async () => {
  const result = await knex.raw(
    `
    SELECT
      ar.*,
      mp.unique_member_id,
      u.first_name,
      u.last_name
    FROM attendance_records ar
    JOIN member_profiles mp
      ON ar.member_profile_id = mp.id
    JOIN users u
      ON mp.user_id = u.id
    WHERE DATE(ar.checked_in_at) = CURRENT_DATE
    ORDER BY ar.checked_in_at DESC
    `,
  );

  return result.rows;
};

module.exports = {
  getMemberByUniqueId,
  checkIn,
  getCheckInHistory,
  getTodayCheckIns,
  overRideCheckIn,
};
