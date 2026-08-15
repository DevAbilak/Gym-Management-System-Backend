const knex = require('../db/db');

// HELPER FUNCTION: Validate time ordering
const validateClassTimes = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime())) {
    throw new Error('Invalid start_time format');
  }
  if (isNaN(end.getTime())) {
    throw new Error('Invalid end_time format');
  }
  if (start >= end) {
    throw new Error('end_time must be after start_time');
  }
};

const createClass = async (payload) => {
  const {
    trainer_id,
    name,
    description,
    category,
    difficulty,
    capacity,
    start_time,
    end_time,
    location,
  } = payload;

  validateClassTimes(start_time, end_time);

  const result = await knex.raw(
    `
    INSERT INTO classes (
      trainer_id, name, description, category, difficulty, capacity, start_time, end_time, location
    ) VALUES (?,?,?,?,?,?,?,?,?)
    RETURNING *
  `,
    [
      trainer_id,
      name,
      description,
      category,
      difficulty,
      capacity,
      start_time,
      end_time,
      location,
    ],
  );

  return result.rows[0];
};

const listClasses = async (filters = {}) => {
  const { date, discipline, trainer_id, page = 1, limit = 20 } = filters;
  const conditions = [];
  const params = [];

  // date filter
  if (date) {
    conditions.push('DATE(c.start_time) = ?');
    params.push(date);
  }

  // discipline filter
  if (discipline) {
    conditions.push('c.category = ?');
    params.push(discipline);
  }

  // trainer filter
  if (trainer_id) {
    conditions.push('c.trainer_id = ?');
    params.push(trainer_id);
  }

  // only show upcoming/scheduled classes
  conditions.push('c.status = \'scheduled\'');
  conditions.push('c.start_time > NOW()');

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const query = `
    SELECT 
      c.id,
      c.name,
      c.description,
      c.category,
      c.difficulty,
      c.capacity,
      c.current_bookings,
      (c.capacity - c.current_bookings) AS available_spots,
      c.start_time,
      c.end_time,
      c.location,
      c.status,
      u.id AS trainer_user_id,
      u.first_name || ' ' || u.last_name AS trainer_name,
      u.email AS trainer_email
    FROM classes c
    JOIN trainers tr ON c.trainer_id = tr.id
    JOIN users u ON tr.user_id = u.id
    ${whereClause}
    ORDER BY c.start_time ASC
    LIMIT ? OFFSET ?
  `;

  params.push(limit, offset);
  const result = await knex.raw(query, params);
  return result.rows;
};

const getClassById = async (id) => {
  const result = await knex.raw(
    `
    SELECT 
      c.*,
      u.first_name || ' ' || u.last_name AS trainer_name,
      (c.capacity - c.current_bookings) AS available_spots
      FROM classes c
      JOIN trainers tr ON c.trainer_id = tr.id
      JOIN users u ON tr.user_id = u.id
      WHERE c.id = ?
  `,
    [id],
  );
  return result.rows[0];
};

const updateClass = async (id, updates) => {
  const allowedFields = [
    'name',
    'description',
    'category',
    'difficulty',
    'capacity',
    'start_time',
    'end_time',
    'location',
    'status',
  ];
  const setClauses = [];
  const Values = [];

  // Validate time ordering if both times are provided in the update
  if (updates.start_time && updates.end_time) {
    validateClassTimes(updates.start_time, updates.end_time);
  }

  // If only one time is provided
  if (updates.start_time && !updates.end_time) {
    const current = await getClassById(id);
    if (current) {
      const endTime = updates.end_time || current.end_time;
      validateClassTimes(updates.start_time, endTime);
    }
  }

  if (!updates.start_time && updates.end_time) {
    const current = await getClassById(id);
    if (current) {
      const startTime = updates.start_time || current.end_time;
      validateClassTimes(startTime, updates.end_time);
    }
  }

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      Values.push(updates[field]);
    }
  });

  if (setClauses.length === 0) {
    throw new Error('No valid fields to update');
  }
  Values.push(id);

  const query = `
    UPDATE classes 
    SET ${setClauses.join(', ')}, updated_at = NOW()
    WHERE id = ?
    RETURNING *
  `;
  const result = await knex.raw(query, Values);
  return result.rows[0];
};

module.exports = {
  createClass,
  listClasses,
  getClassById,
  updateClass,
};
