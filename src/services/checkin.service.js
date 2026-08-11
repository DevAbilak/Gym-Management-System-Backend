const knex = require("../db/db");
const { redisClient } = require("../config/redis");

const CACHE_TTL = 300; // 5 minutes

const getMemberByUniqueId = async (uniqueId) => {
  // check redis cache
  const cached = await redisClient.get(`member:${uniqueId}`);
  // cache hit
  if (cached) {
    return json.parse(cached);
  }

  // cache miss
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
      s.status as subscription_status,
      s.expiry_date
    FROM member_profiles mp
    JOIN users u ON mp.user_id = u.id
    LEFT JOIN subscriptions s ON s.member_profile_id = mp.id AND s.status = 'active'
    WHERE mp.unique_member_id = ?
  `,
    [uniqueId],
  );

  const member = result.rows[0];
  if (member) {
    await redisClient.set(
      `member:${uniqueId}`,
      JSON.stringify(member),
      "EX",
      CACHE_TTL,
    );
  }

  return member;
};

const checkIn = async (uniqueId, verifiedBy = null) => {
  const member = getMemberByUniqueId(uniqueId);
  if (!member) {
    throw new Error("Member not found");
  }

  if (!member.is_active) {
    throw new Error("Account is deactivated");
  }

  // record check-in
  const result = await knex.raw(
    `
    INSERT INTO attendance_records (member_profile_id, check_in_type,
    checked_in_at, verified_by) VALUES (?,'gym_entry',NOW(),?)
    RETURNING *
  `,
    [member.id, verifiedBy],
  );

  // invalidate cache(in case status changed)
  await redisClient.del(`member${uniqueId}`);

  return {
    member: {
      id: member.id,
      unique_member_id: member.unique_member_id,
      full_name: `${member.first_name} ${member.last_name}`,
      email: member.email,
    },
    checkin: result.rows[0],
    status: "success",
  };
};

const overRideCheckIn = async (uniqueId, reason, verified_by) => {
  const member = getMemberByUniqueId(uniqueId);
  if (!member) {
    throw new Error("Member not found");
  }

  const result = await knex.raw(
    `
    INSERT INTO attendance_records (
      member_profile_id, check_in_type, checked_in_at, verified_by, notes
    ) VALUES (?,'gym_entry',NOW(),?,?)
    RETURNING *
  `,
    [member.id, verified_by, `OVERRIDE: ${reason}`],
  );

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
    LIMIT = ?
  `,
    [memberId, limit],
  );

  return result.rows;
};

const getTodayCheckIns = async () => {
  const result = await knex.raw(`
    SELECT 
      ar.*
      mp.unique_member_id,
      u.first_name
      u.last_name
    FROM attendance_records ar
    JOIN member_profiles mp ON ar.member_profile_id = mp.id
    JOIN users u ON mp.user_id = u.id
    WHERE DATE(ar.checked_in_at) = CURRENT_DATE
    ORDER BY ar.checked_in_at DESC
  `);
  return result.rows;
};

module.exports = {
  getMemberByUniqueId,
  checkIn,
  getCheckInHistory,
  getTodayCheckIns,
};
