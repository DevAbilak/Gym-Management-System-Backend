const knex = require('../db/db');
const { redisClient } = require('../config/redis');

const KPI_CACHE_TTL = 300; // 5 minutes

const getAdminKPIs = async () => {
  const cacheKey = 'admin:kpis';

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const activeMembersResult = await knex.raw(`
    SELECT COUNT(DISTINCT member_profile_id) as active_members
    FROM subscriptions
    WHERE status = 'active'
  `);

  const checkinsResult = await knex.raw(`
    SELECT COUNT(*) as today_checkins
    FROM attendance_records 
    WHERE DATE(checked_in_at) = CURRENT_DATE
  `);

  const revenueResult = await knex.raw(`
    SELECT COALESCE(SUM(t.price / NULLIF(t.duration_months, 0)), 0) as monthly_revenue
    FROM subscriptions s
    JOIN membership_tiers t ON s.membership_tier_id = t.id
    WHERE s.status = 'active'
  `);

  const trainerRatingResult = await knex.raw(`
    SELECT COALESCE(AVG(rating_stars),0)::DECIMAL(3,2) as avg_trainer_rating
    FROM ratings
    WHERE rating_type = 'trainer'
  `);

  const satisfactionResult = await knex.raw(`
    SELECT COALESCE(AVG(rating_stars),0)::DECIMAL(3,2) as satisfaction_index
    FROM ratings
    WHERE rating_type = 'facility'
  `);

  const kpis = {
    active_members: parseInt(activeMembersResult.rows[0]?.active_members || 0),
    today_checkins: parseInt(checkinsResult.rows[0]?.today_checkins || 0),
    monthly_revenue: parseFloat(revenueResult.rows[0]?.monthly_revenue || 0),
    avg_trainer_rating: parseFloat(
      trainerRatingResult.rows[0]?.avg_trainer_rating || 0,
    ),
    satisfaction_index: parseFloat(
      satisfactionResult.rows[0]?.satisfaction_index || 0,
    ),
    last_updated: new Date().toISOString(),
  };

  await redisClient.set(cacheKey, JSON.stringify(kpis), 'EX', KPI_CACHE_TTL);

  return kpis;
};

const invalidateKpiCache = async () => {
  await redisClient.del('admin:kpis');
};

module.exports = { getAdminKPIs, invalidateKpiCache };
