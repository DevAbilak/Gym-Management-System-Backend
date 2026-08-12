const knex = require('../db/db');
const { generateUniqueMemberId } = require('./idGenerator.service');

const createMember = async (payload) => {
  const {
    user_id,
    date_of_birth,
    gender,
    fitness_goal,
    emergency_contact_name,
    emergency_contact_phone,
  } = payload;

  const unique_member_id = generateUniqueMemberId();

  const result = await knex.raw(
    `INSERT INTO member_profiles (
      user_id, unique_member_id, date_of_birth, gender, fitness_goal, emergency_contact_name, emergency_contact_phone
    ) VALUES (?,?,?,?,?,?,?) RETURNING *
  `,
    [
      user_id,
      unique_member_id,
      date_of_birth,
      gender,
      fitness_goal,
      emergency_contact_name,
      emergency_contact_phone,
    ],
  );

  return result.rows[0];
};

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
  createMember,
  getAllMembers,
  getMemberById,
  getMemberByUniqueId,
  getMemberByUserId,
  updateMember,
};
