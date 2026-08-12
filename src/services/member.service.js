const knex = require('../db/db');

const getAllMembers = async () => {
  const result = await knex.raw('SELECT * FROM member_profiles');
  return result.rows[0];
};

const getMemberById = async (id) => {
  const result = await knex.raw('SELECT * FROM member_profiles WHERE id = ?', [
    id,
  ]);
  return result.rows[0];
};

const getMemberByUserId = async (userId) => {
  const result = await knex.raw(
    'SELECT * FROM member_profiles WHERE user_id = ?',
    [userId],
  );
  return result.rows[0];
};

const getMemberByUniqueId = async (uniqueMemberId) => {
  const result = await knex.raw(
    'SELECT * FROM member_profiles WHERE unique_member_id = ?',
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

module.exports = {
  getAllMembers,
  getMemberById,
  getMemberByUniqueId,
  getMemberByUserId,
  updateMember,
};
