const knex = require('../db/db');
const healthMetric = require('../models/healthMetric');

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
  const metric = new HealthMetric({
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
  return metric;
};

const getLatestMetrics = async (memberId) => {
  return await healthMetric
    .findOne({ member_id: memberId })
    .sort({ recorded_at: -1 });
};

const getMetricsHistory = async (memberId, limit = 30, skip = 0) => {
  return await healthMetric
    .find({ member_id: memberId })
    .sort({ recorded_at: -1 })
    .limit(limit)
    .skip(skip);
};

const getMetricsBYDateRange = async (memberId, startDate, endDate) => {
  return await healthMetric
    .find({
      member_id: memberId,
      recorded_at: {
        $gte: new Date(startDate),
        $lte: newDate(endDate),
      },
    })
    .sort({ recorded_at: 1 });
};

const deleteMetric = async (id) => {
  const result = await HealthMetric.findByIdAndDelete(id);
  if (!result) {
    throw new Error('Health metric not found');
  }
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
};
