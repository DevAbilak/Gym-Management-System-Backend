const knex = require('../db/db');
const healthMetric = require('../models/healthMetric');
const { redisClient } = require('../config/redis');

const CACHE_TTL = 300; //5 minutes

// HELPER FUNCTION: invalidate health cache for a member
const invalidateHealthCache = async (memberId) => {
  await redisClient.del(`health:latest:${memberId}`);

  const keys = await redisClient.keys(`health:history:${memberId}:*`);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }

  const rangeKeys = await redisClient.keys(`health:range:${memberId}:*`);
  if (rangeKeys.length > 0) {
    await redisClient.del(rangeKeys);
  }
};

// HELPER FUNCTION: Calculate BMI
const calculateBMI = (weightKg, heightCm) => {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(2));
};

const saveHealthProfile = async (payload) => {
  const {
    member_id,
    weight_kg,
    height_cm,
    blood_type,
    dietary_restrictions,
    body_fat_percentage,
    muscle_mass_kg,
    waist_cm,
    notes,
  } = payload;

  // Verify member exists in PostgreSQL
  const memberCheck = await knex.raw(
    'SELECT id FROM member_profiles WHERE id = ?',
    [member_id],
  );
  if (memberCheck.rows.length === 0) {
    throw new Error(`Member with ID ${member_id} does not exist`);
  }

  const bmi = calculateBMI(weight_kg, height_cm);

  // create mongodb document
  const metric = new healthMetric({
    member_id,
    weight_kg,
    height_cm,
    bmi,
    blood_type: blood_type || null,
    dietary_restrictions: dietary_restrictions || null,
    body_fat_percentage: body_fat_percentage || null,
    muscle_mass_kg: muscle_mass_kg || null,
    waist_cm: waist_cm || null,
    notes: notes || null,
    recorded_at: new Date(),
  });

  await metric.save();

  // invalidate cache for this member
  await invalidateHealthCache(member_id);

  return metric;
};

const getLatestMetrics = async (memberId) => {
  const cacheKey = `health:latest:${memberId}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const metric = await healthMetric
    .findOne({ member_id: memberId })
    .sort({ recorded_at: -1 });

  if (metric) {
    await redisClient.set(cacheKey, JSON.stringify(metric), 'EX', CACHE_TTL);
  } else {
    // cache null/empty result for 1 minute to avoid repeated DB hits
    await redisClient.set(cacheKey, JSON.stringify(null), 'EX', 60);
  }

  return metric;
};

const getMetricsHistory = async (memberId, limit = 30, skip = 0) => {
  const page = Math.floor(skip / limit) + 1;
  const cacheKey = `health:history:${memberId}:page:${page}:limit:${limit}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const metrics = await healthMetric
    .find({ member_id: memberId })
    .sort({ recorded_at: -1 })
    .limit(limit)
    .skip(skip);

  if (metrics) {
    await redisClient.set(cacheKey, JSON.stringify(metrics), 'EX', CACHE_TTL);
  }

  return metrics;
};

const getMetricsBYDateRange = async (memberId, startDate, endDate) => {
  const cacheKey = `health:range:${memberId}:${startDate}:${endDate}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const metrics = await healthMetric
    .find({
      member_id: memberId,
      recorded_at: {
        $gte: new Date(startDate),
        $lte: newDate(endDate),
      },
    })
    .sort({ recorded_at: 1 });

  if (metrics) {
    // store in cache with short TTL (1 minute) because date ranges are dynamic
    await redisClient.set(cacheKey, JSON.stringify(metrics), 'EX', 60);
  }

  return metrics;
};

const deleteMetric = async (id) => {
  const metric = await HealthMetric.findById(id);
  if (!metric) {
    throw new Error('Health metric not found');
  }

  const memberId = metric.member_id;

  // Delete the document
  await HealthMetric.findByIdAndDelete(id);

  // Invalidate cache for this member
  await invalidateHealthCache(memberId);

  return { message: 'Health metric deleted successfully' };
};

const getAllMetricsForMember = async (memberId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    HealthMetric.find({ member_id: memberId })
      .sort({ recorded_at: -1 })
      .limit(limit)
      .skip(skip),
    HealthMetric.countDocuments({ member_id: memberId }),
  ]);

  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  calculateBMI,
  saveHealthProfile,
  getLatestMetrics,
  getMetricsHistory,
  getMetricsBYDateRange,
  deleteMetric,
  getAllMetricsForMember,
  invalidateHealthCache,
};
