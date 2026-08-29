const knex = require('../db/db');
const { redisClient } = require('../config/redis');

const CACHE_TTL = 300; // 5 minutes

const submitRating = async (payload) => {
  const {
    member_profile_id,
    rating_type,
    trainer_id,
    class_id,
    rating_stars,
    rating_dimension,
    comment,
    is_anonymous,
  } = payload;

  // check if member has qualifying session to rate trainer
  if (rating_type === 'trainer') {
    const sessionCheck = await knex.raw(
      `
      SELECT 1 FROM class_bookings cb
      JOIN classes c ON cb.class_id = c.id
      WHERE cb.member_profile_id = ? AND c.trainer_id = ? AND cb.status = 'confirmed'
      LIMIT 1
    `,
      [member_profile_id, trainer_id],
    );

    if (sessionCheck.rows.length === 0) {
      throw new Error(
        'You must have attended a session with this trainer to rate them',
      );
    }
  }

  // Duplicate checks
  let existingCheck = null;

  if (rating_type === 'trainer') {
    existingCheck = await knex.raw(
      `
      SELECT 1 FROM ratings
      WHERE member_profile_id = ? AND rating_type = 'trainer' AND trainer_id = ?
      LIMIT 1
      `,
      [member_profile_id, trainer_id],
    );
    if (existingCheck.rows.length > 0) {
      throw new Error('You have already rated this trainer.');
    }
  }

  if (rating_type === 'class') {
    existingCheck = await knex.raw(
      `
      SELECT 1 FROM ratings
      WHERE member_profile_id = ? AND rating_type = 'class' AND class_id = ?
      LIMIT 1
      `,
      [member_profile_id, class_id],
    );
    if (existingCheck.rows.length > 0) {
      throw new Error('You have already rated this class.');
    }

    const bookingCheck = await knex.raw(
      `
      SELECT 1 FROM class_bookings
      WHERE member_profile_id = ? AND class_id = ? AND status = 'confirmed'
      LIMIT 1
      `,
      [member_profile_id, class_id],
    );
    if (bookingCheck.rows.length === 0) {
      throw new Error('You must have booked this class to rate it');
    }
  }

  if (rating_type === 'facility') {
    existingCheck = await knex.raw(
      `
      SELECT 1 FROM ratings
      WHERE member_profile_id = ? AND rating_type = 'facility'
      LIMIT 1
      `,
      [member_profile_id],
    );
    if (existingCheck.rows.length > 0) {
      throw new Error('You have already rated the facility.');
    }
  }

  // check active subscription
  // const subCheck = await knex.raw(
  //   `
  //   SELECT 1 FROM subscriptions
  //   WHERE member_profile_id = ? AND status = 'active'
  //   LIMIT 1
  // `,
  //   [member_profile_id],
  // );

  // if (subCheck.rows.length === 0) {
  //   throw new Error("Active subscription required to submit a rating");
  // }

  const result = await knex.raw(
    `
    INSERT INTO ratings (
      member_profile_id, rating_type, trainer_id, class_id, rating_stars, rating_dimensions, comment, is_anonymous
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `,
    [
      member_profile_id,
      rating_type,
      trainer_id || null,
      class_id || null,
      rating_stars,
      rating_dimension || null,
      comment || null,
      is_anonymous || false,
    ],
  );

  if (rating_type === 'trainer') {
    await redisClient.del(`rating:trainer:${trainer_id}`);
  }

  if (rating_type === 'facility') {
    await redisClient.del('rating:facility');
  }

  return result.rows[0];
};

const getAverageTrainerRating = async (trainerId) => {
  const cacheKey = `rating:trainer:${trainerId}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await knex.raw(
    `
    SELECT
      AVG(rating_stars)::DECIMAL(3,2) as average_rating,
      COUNT(*) AS total_reviews,
      COUNT(*) FILTER (WHERE rating_stars = 5) as five_star_count,
      COUNT(*) FILTER (WHERE rating_stars = 4) as four_star_count,
      COUNT(*) FILTER (WHERE rating_stars = 3) as three_star_count,
      COUNT(*) FILTER (WHERE rating_stars = 2) as two_star_count,
      COUNT(*) FILTER (WHERE rating_stars = 1) as one_star_count
    FROM ratings
    WHERE trainer_id = ? AND rating_type = 'trainer'
  `,
    [trainerId],
  );

  const stats = result.rows[0] || { average_rating: 0, total_reviews: 0 };

  await redisClient.set(cacheKey, JSON.stringify(stats), 'EX', CACHE_TTL);

  return stats;
};

const getFacilityRatingSummary = async () => {
  const cacheKey = 'rating:facility';

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await knex.raw(`
    SELECT
      AVG(rating_stars)::DECIMAL(3,2) AS average_rating,
      COUNT(*) AS total_reviews
    FROM ratings
    WHERE rating_type = 'facility'
  `);

  const summary = result.rows[0] || { average_rating: 0, total_reviews: 0 };

  await redisClient.set(cacheKey, JSON.stringify(summary), 'EX', CACHE_TTL);

  return summary;
};

const getFlaggedRatings = async (threshold = 3) => {
  const result = await knex.raw(
    `
    SELECT
      r.*,
      u.first_name || ' ' || u.last_name as member_name,
      COALESCE(t.first_name || ' ' || t.last_name, 'N/A') as trainer_name
    FROM ratings r
    JOIN member_profiles mp ON r.member_profile_id = mp.id
    JOIN users u ON mp.user_id = u.id
    LEFT JOIN trainers tr ON r.trainer_id = tr.id
    LEFT JOIN users t ON tr.user_id = t.id
    WHERE r.rating_stars < ? AND r.is_moderated = false
    ORDER BY r.created_at DESC
  `,
    [threshold],
  );

  return result.rows;
};

const moderateRating = async (ratingId, moderationNotes) => {
  const result = await knex.raw(
    `
    UPDATE ratings
    SET is_moderated = true, moderation_notes = ?, updated_at = NOW()
    WHERE id = ?
    RETURNING *
  `,
    [moderationNotes, ratingId],
  );

  if (result.rows.length === 0) {
    throw new Error('Rating not found');
  }

  const rating = result.rows[0];
  if (rating.rating_type === 'trainer' && rating.trainer_id) {
    await redisClient.del(`rating:trainer:${rating.trainer_id}`);
  }
  if (rating.rating_type === 'facility') {
    await redisClient.del('rating:facility');
  }

  return result.rows[0];
};

module.exports = {
  submitRating,
  getAverageTrainerRating,
  getFacilityRatingSummary,
  getFlaggedRatings,
  moderateRating,
};
