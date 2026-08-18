const knex = require('../db/db');

const getAllMembers = async () => {
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
  const result = await knex.raw(
    `
    SELECT
      mp.*,
      u.email,
      u.first_name,
      u.last_name,
      u.phone,
      u.is_active,
      u.role
    FROM member_profiles mp
    JOIN users u ON mp.user_id = u.id
    WHERE mp.id = ?
  `,
    [id],
  );
  return result.rows[0];
};

const getMemberByUserId = async (userId) => {
  const result = await knex.raw(
    `
    SELECT
      mp.*,
      u.email,
      u.first_name,
      u.last_name,
      u.phone,
      u.is_active,
      u.role
    FROM member_profiles mp
    JOIN users u ON mp.user_id = u.id
    WHERE mp.user_id = ?
  `,
    [userId],
  );
  return result.rows[0];
};

const getMemberByUniqueId = async (uniqueMemberId) => {
  const result = await knex.raw(
    `
    SELECT
      mp.*,
      u.email,
      u.first_name,
      u.last_name,
      u.phone,
      u.is_active,
      u.role
    FROM member_profiles mp
    JOIN users u ON mp.user_id = u.id
    WHERE mp.unique_member_id = ?
  `,
    [uniqueMemberId],
  );
  return result.rows[0];
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
  return result.rows[0];
};

const deactivateMember = async (id) => {
  const member = getMemberById(id);
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
