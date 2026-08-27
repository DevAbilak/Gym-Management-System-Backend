const { redisClient } = require('../config/redis');
const { MealPlan, WorkoutTemplate } = require('../models/index');
const knex = require('../db/db');

const MEMBER_CACHE_TTL = 300; // 5 minutes

const getAllMembers = async (filters) => {
  const { page = 1, limit = 20, search, status } = filters;
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  // Build search condition
  if (search) {
    conditions.push(
      '(u.first_name ILIKE ? OR u.last_name ILIKE ? OR u.email ILIKE ? OR mp.unique_member_id ILIKE ?)',
    );
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  // Build status filter
  if (status === 'active') {
    conditions.push('u.is_active = true');
  } else if (status === 'inactive') {
    conditions.push('u.is_active = false');
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Main query with pagination
  const result = await knex.raw(
    `
    SELECT
      mp.id,
      mp.user_id,
      mp.unique_member_id,
      mp.date_of_birth,
      mp.gender,
      mp.blood_type,
      mp.dietary_restrictions,
      mp.fitness_goal,
      mp.emergency_contact_name,
      mp.emergency_contact_phone,
      mp.created_at,
      mp.updated_at,
      u.email,
      u.first_name,
      u.last_name,
      u.phone,
      u.is_active,
      u.role,
      s.status AS subscription_status,
      t.name AS tier_name
    FROM member_profiles mp
    JOIN users u ON mp.user_id = u.id
    LEFT JOIN subscriptions s ON s.member_profile_id = mp.id AND s.status = 'active'
    LEFT JOIN membership_tiers t ON s.membership_tier_id = t.id
    ${whereClause}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `,
    [...params, limit, offset],
  );

  // Count total for pagination
  const countResult = await knex.raw(
    `
    SELECT COUNT(*) as total
    FROM member_profiles mp
    JOIN users u ON mp.user_id = u.id
    ${whereClause}
  `,
    params,
  );
  const total = parseInt(countResult.rows[0]?.total || 0);

  return {
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getMemberById = async (id) => {
  const cacheKey = `member:profile:${id}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await knex.raw(
    `
    SELECT
      mp.*,
      u.email,
      u.first_name,
      u.last_name,
      u.phone,
      u.is_active,
      u.role,
      u.id AS user_id,
      ma.id AS assignment_id,
      ma.trainer_id,
      ma.workout_template_id,
      ma.meal_plan_id,
      ma.assigned_at AS plan_assigned_at,
      ma.notes AS assignment_notes,
      t.first_name || ' ' || t.last_name AS trainer_name
    FROM member_profiles mp
    JOIN users u ON mp.user_id = u.id
    LEFT JOIN member_assignments ma ON ma.member_profile_id = mp.id AND ma.is_active = true
    LEFT JOIN trainers tr ON ma.trainer_id = tr.id
    LEFT JOIN users t ON tr.user_id = t.id
    WHERE mp.id = ?
  `,
    [id],
  );
  const member = result.rows[0];

  // Fetch plan names from MongoDB (if assignment exists)
  let active_workout_plan = null;
  let active_meal_plan = null;

  if (member.workout_template_id) {
    const template = await WorkoutTemplate.findById(member.workout_template_id);
    if (template) active_workout_plan = template.name;
  }

  if (member.meal_plan_id) {
    const plan = await MealPlan.findById(member.meal_plan_id);
    if (plan) active_meal_plan = plan.name;
  }

  const enrichedMember = {
    id: member.id,
    user_id: member.user_id,
    unique_member_id: member.unique_member_id,
    date_of_birth: member.date_of_birth,
    gender: member.gender,
    blood_type: member.blood_type,
    dietary_restrictions: member.dietary_restrictions,
    fitness_goal: member.fitness_goal,
    emergency_contact_name: member.emergency_contact_name,
    emergency_contact_phone: member.emergency_contact_phone,
    created_at: member.created_at,
    updated_at: member.updated_at,
    email: member.email,
    first_name: member.first_name,
    last_name: member.last_name,
    phone: member.phone,
    is_active: member.is_active,
    role: member.role,
    // Assignment data
    assignment: member.assignment_id
      ? {
          id: member.assignment_id,
          trainer_id: member.trainer_id,
          trainer_name: member.trainer_name,
          workout_template_id: member.workout_template_id,
          workout_template_name: active_workout_plan,
          meal_plan_id: member.meal_plan_id,
          meal_plan_name: active_meal_plan,
          assigned_at: member.plan_assigned_at,
          notes: member.assignment_notes,
        }
      : null,
  };

  if (member) {
    await redisClient.set(
      cacheKey,
      JSON.stringify(enrichedMember),
      'EX',
      MEMBER_CACHE_TTL,
    );
  }

  return enrichedMember;
};

const getMemberByUserId = async (userId) => {
  const member = await knex.raw(
    'SELECT id FROM member_profiles WHERE user_id = ?',
    [userId],
  );
  if (member.rows.length === 0) return null;
  return await getMemberById(member.rows[0].id);
};

const getMemberByUniqueId = async (uniqueMemberId) => {
  const member = await knex.raw(
    'SELECT id FROM member_profiles WHERE unique_member_id = ?',
    [uniqueMemberId],
  );
  if (member.rows.length === 0) return null;
  return await getMemberById(member.rows[0].id);
};

const updateMember = async (id, updates) => {
  const allowedFields = [
    'date_of_birth',
    'gender',
    'fitness_goal',
    'emergency_contact_name',
    'emergency_contact_phone',
    'blood_type',
    'dietary_restrictions',
  ];

  const setClauses = [];
  const values = [];

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      values.push(updates[field]);
    }
  });

  if (setClauses.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(id);
  const query = `
    UPDATE member_profiles SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = ?
    RETURNING *
  `;

  const result = await knex.raw(query, values);
  const updatedMember = result.rows[0];

  if (updatedMember) {
    // --- Invalidate all cached representations of this member ---
    // By ID
    await redisClient.del(`member:profile:${id}`);
    // By User ID
    await redisClient.del(`member:user:${updatedMember.user_id}`);
    // By Unique ID (used by check-in)
    if (updatedMember.unique_member_id) {
      await redisClient.del(`member:${updatedMember.unique_member_id}`);
    }
  }

  return updatedMember;
};

const deactivateMember = async (id) => {
  const member = await getMemberById(id);
  if (!member) {
    return null;
  }

  // deactivate the user account
  const result = await knex.raw(
    `
    UPDATE users
    SET is_active = false, updated_at = NOW()
    WHERE id = ?
    RETURNING id,email,first_name,last_name,is_active 
  `,
    [member.user_id],
  );

  // Invalidate all caches
  await redisClient.del(`member:profile:${id}`);
  await redisClient.del(`member:user:${member.user_id}`);
  if (member.unique_member_id) {
    await redisClient.del(`member:${member.unique_member_id}`);
  }

  delete member.is_active;

  return {
    ...member,
    user: result.rows[0],
  };
};

const reactivateMember = async (id) => {
  const member = await getMemberById(id);
  if (!member) {
    return null;
  }

  const result = await knex.raw(
    `
    UPDATE users
    SET is_active = true, updated_at = NOW()
    WHERE id = ?
    RETURNING id,email,first_name,last_name,is_active
  `,
    [member.user_id],
  );

  // Invalidate all caches
  await redisClient.del(`member:profile:${id}`);
  await redisClient.del(`member:user:${member.user_id}`);
  if (member.unique_member_id) {
    await redisClient.del(`member:${member.unique_member_id}`);
  }

  delete member.is_active;

  return {
    ...member,
    user: result.rows[0],
  };
};

module.exports = {
  getAllMembers,
  getMemberById,
  getMemberByUniqueId,
  getMemberByUserId,
  updateMember,
  deactivateMember,
  reactivateMember,
};
