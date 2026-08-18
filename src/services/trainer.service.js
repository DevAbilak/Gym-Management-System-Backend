const knex = require('../db/db');

// GET ALL TRAINERS
const getAllTrainers = async () => {
  const result = await knex.raw(`
    SELECT
      t.id,
      t.user_id,
      t.specialty,
      t.years_of_experience,
      t.certification,
      t.bio,
      t.hourly_rate,
      t.is_available,
      t.created_at,
      t.updated_at,
      u.first_name,
      u.last_name,
      u.email,
      u.phone
    FROM trainers t
    JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC
  `);

  return result.rows;
};

// GET TRAINER BY ID
const getTrainerById = async (trainerId) => {
  const result = await knex.raw(
    `
    SELECT
      t.id,
      t.user_id,
      t.specialty,
      t.years_of_experience,
      t.certification,
      t.bio,
      t.hourly_rate,
      t.is_available,
      t.created_at,
      t.updated_at,
      u.first_name,
      u.last_name,
      u.email,
      u.phone
    FROM trainers t
    JOIN users u ON t.user_id = u.id
    WHERE t.id = ?
    `,
    [trainerId],
  );

  return result.rows[0];
};

// GET TRAINER BY USER ID
const getTrainerByUserId = async (userId) => {
  const result = await knex.raw(
    `
    SELECT
      t.id,
      t.user_id,
      t.specialty,
      t.years_of_experience,
      t.certification,
      t.bio,
      t.hourly_rate,
      t.is_available,
      t.created_at,
      t.updated_at,
      u.first_name,
      u.last_name,
      u.email,
      u.phone
    FROM trainers t
    JOIN users u ON t.user_id = u.id
    WHERE t.user_id = ?
    `,
    [userId],
  );

  return result.rows[0];
};

// UPDATE TRAINER PROFILE
const updateTrainer = async (trainerId, payload) => {
  const {
    specialty,
    years_of_experience,
    certification,
    bio,
    hourly_rate,
  } = payload;

  const result = await knex.raw(
    `
    UPDATE trainers
    SET
      specialty = COALESCE(?, specialty),
      years_of_experience = COALESCE(?, years_of_experience),
      certification = COALESCE(?, certification),
      bio = COALESCE(?, bio),
      hourly_rate = COALESCE(?, hourly_rate),
      updated_at = NOW()
    WHERE id = ?
    RETURNING *
    `,
    [
      specialty ?? null,
      years_of_experience ?? null,
      certification ?? null,
      bio ?? null,
      hourly_rate ?? null,
      trainerId,
    ],
  );

  return result.rows[0];
};

// UPDATE TRAINER AVAILABILITY
const updateAvailability = async (trainerId, isAvailable) => {
  const result = await knex.raw(
    `
    UPDATE trainers
    SET
      is_available = ?,
      updated_at = NOW()
    WHERE id = ?
    RETURNING *
    `,
    [isAvailable, trainerId],
  );

  return result.rows[0];
};

module.exports = {
  getAllTrainers,
  getTrainerById,
  getTrainerByUserId,
  updateTrainer,
  updateAvailability,
};