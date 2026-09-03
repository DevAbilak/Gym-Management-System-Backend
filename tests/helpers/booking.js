const knex = require("../../src/db/db");

const createTestClass = async (trainerId, overrides = {}) => {
  const startTime = new Date(Date.now() + 86400000); // tomorrow
  const endTime = new Date(startTime.getTime() + 3600000); // 1 hour later

  const result = await knex.raw(
    `
    INSERT INTO classes (trainer_id, name, category, capacity, start_time, end_time, location) VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING id
  `,
    [
      trainerId,
      overrides.name || "Test Class",
      overrides.category || "hiit",
      overrides.capacity || 10,
      startTime.toISOString(),
      endTime.toISOString(),
      overrides.location || "Studio A",
    ],
  );

  return result.rows[0].id;
};

const getBookingById = async (bookingId) => {
  const result = await knex.raw(
    `
    SELECT cb.*, c.id AS class_id, c.name AS class_name, c.start_time, c.end_time, mp.user_id AS member_user_id
    FROM class_bookings cb
    JOIN classes c ON cb.class_id = c.id
    JOIN member_profiles mp ON cb.member_profile_id = mp.id
    WHERE cb.id = ?
    `,
    [bookingId],
  );
  return result.rows[0] || null;
};

module.exports = {
  createTestClass,
  getBookingById,
};
