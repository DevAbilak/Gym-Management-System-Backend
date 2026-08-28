const knex = require('../db/db');
const { redisClient } = require('../config/redis');

const CACHE_TTL = 300; // 5 minutes

// HELPER: Invalidate progress cache
const invalidateProgressCache = async (memberProfileId) => {
  const keys = await redisClient.keys(`progress:history:${memberProfileId}:*`);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

const logProgress = async (payload) => {
  const {
    member_assignment_id,
    weight_kg,
    body_fat_percentage,
    muscle_mass_kg,
    notes,
  } = payload;

  // validate member assignment exists and is active
  const assignment = await knex.raw(
    `
    SELECT ma.*, mp.user_id AS member_user_id
    FROM member_assignments ma
    JOIN member_profiles mp ON ma.member_profile_id = mp.id
    WHERE ma.id = ? AND ma.is_active = true
  `,
    [member_assignment_id],
  );

  if (assignment.rows.length === 0) {
    throw new Error('Active assignment not found for this member.');
  }

  const memberProfileId = assignment.rows[0].member_profile_id;

  const result = await knex.raw(
    `
    INSERT INTO member_progress_logs (
      member_assignment_id,
      weight_kg,
      body_fat_percentage,
      muscle_mass_kg,
      notes
    ) VALUES (?,?,?,?,?)
     RETURNING *
  `,
    [
      member_assignment_id,
      weight_kg || null,
      body_fat_percentage || null,
      muscle_mass_kg || null,
      notes || null,
    ],
  );

  await invalidateProgressCache(memberProfileId);
  await redisClient.del(`progress:latest:${memberProfileId}`);

  return result.rows[0];
};

const getProgressHistory = async (memberProfileId, limit = 20, page = 1) => {
  const offset = (page - 1) * limit;
  const cacheKey = `progress:history:${memberProfileId}:page:${page}:limit:${limit}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await knex.raw(
    `
    SELECT 
      mpl.id,
      mpl.member_assignment_id,
      mpl.weight_kg,
      mpl.body_fat_percentage,
      mpl.muscle_mass_kg,
      mpl.notes,
      mpl.logged_at,
      u.first_name || ' ' || u.last_name AS trainer_name
    FROM member_progress_logs mpl
    JOIN member_assignments ma on mpl.member_assignment_id = ma.id
    JOIN trainers tr ON ma.trainer_id = tr.id
    JOIN users u ON tr.user_id = u.id
    WHERE ma.member_profile_id = ?
    ORDER BY mpl.logged_at DESC
    LIMIT ? OFFSET ?
  `,
    [memberProfileId, limit, offset],
  );

  const countResult = await knex.raw(
    `
    SELECT COUNT(*) AS total
    FROM member_progress_logs mpl
    JOIN member_assignments ma ON mpl.member_assignment_id = ma.id
    WHERE ma.member_profile_id = ?
  `,
    [memberProfileId],
  );

  const total = parseInt(countResult.rows[0]?.total || 0);

  const data = {
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  if (data) {
    await redisClient.set(cacheKey, JSON.stringify(data), 'EX', CACHE_TTL);
  }

  return data;
};

const getLatestProgress = async (memberProfileId) => {
  const cacheKey = `progress:latest:${memberProfileId}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await knex.raw(
    `
    SELECT 
      mpl.*,
      u.first_name || ' ' || u.last_name AS trainer_name
    FROM member_progress_logs mpl
    JOIN member_assignments ma ON mpl.member_assignment_id = ma.id
    JOIN trainers tr ON ma.trainer_id = tr.id
    JOIN users u ON tr.user_id = u.id
    WHERE ma.member_profile_id = ?
    ORDER BY mpl.logged_at DESC
    LIMIT 1
  `,
    [memberProfileId],
  );

  const progress = result.rows[0] || null;

  await redisClient.set(cacheKey, JSON.stringify(progress), 'EX', CACHE_TTL);

  return progress;
};

const deleteProgressLog = async (logId) => {
  const log = await knex.raw(
    `
    SELECT mpl.*,ma.member_profile_id
    FROM member_progress_logs mpl
    JOIN member_assignments ma ON mpl.member_assignment_id = ma.id
    WHERE mpl.id = ?  
  `,
    [logId],
  );

  if (log.rows.length === 0) {
    throw new Error('Progress log not found.');
  }

  const memberProfileId = log.rows[0].member_profile_id;

  await knex.raw('DELETE FROM member_progress_logs WHERE id = ?', [logId]);

  await invalidateProgressCache(memberProfileId);
  await redisClient.del(`progress:latest:${memberProfileId}`);

  return { message: 'Progress log deleted successfully.' };
};

module.exports = {
  logProgress,
  getProgressHistory,
  getLatestProgress,
  deleteProgressLog,
};
