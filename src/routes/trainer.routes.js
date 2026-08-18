const trainerService = require('../services/trainer.service');

// GET MY TRAINER PROFILE
const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await trainerService.getTrainerByUserId(userId);

    if (!result) {
      return res.status(404).json({
        error: 'Trainer profile not found',
      });
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


// GET TRAINER SCHEDULE
const getSchedule = async (req, res, next) => {
  try {
    const trainerId = req.params.trainerId;
    const { date } = req.query;

    const result = await trainerService.getTrainerSchedule(
      trainerId,
      date,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


// GET CLASS ROSTER
const getClassRoster = async (req, res, next) => {
  try {
    const { trainerId, classId } = req.params;

    const result = await trainerService.getClassRoster(
      trainerId,
      classId,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


// GET MEMBER HEALTH PROFILE
const getMemberHealthProfile = async (req, res, next) => {
  try {
    const { memberProfileId } = req.params;

    const result =
      await trainerService.getMemberHealthProfile(memberProfileId);

    if (!result) {
      return res.status(404).json({
        error: 'Member not found',
      });
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


// GET WORKOUT TEMPLATES
const getWorkoutTemplates = async (req, res, next) => {
  try {
    const trainerId = req.params.trainerId;

    const result =
      await trainerService.getWorkoutTemplates(trainerId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


// GET MEAL PLANS
const getMealPlans = async (req, res, next) => {
  try {
    const trainerId = req.params.trainerId;

    const result =
      await trainerService.getMealPlans(trainerId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


// ASSIGN PLAN
const assignPlan = async (req, res, next) => {
  try {
    const trainerId = req.params.trainerId;

    const {
      member_profile_id,
      workout_template_id,
      meal_plan_id,
      notes,
    } = req.body;

    const result = await trainerService.assignPlan({
      memberProfileId: member_profile_id,
      trainerId,
      workoutTemplateId: workout_template_id,
      mealPlanId: meal_plan_id,
      notes,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};


// GET CLIENT FEEDBACK
const getClientFeedback = async (req, res, next) => {
  try {
    const trainerId = req.params.trainerId;

    const result =
      await trainerService.getClientFeedback(trainerId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


// RECORD PERSONAL TRAINING ATTENDANCE
const recordPersonalTrainingAttendance = async (req, res, next) => {
  try {
    const { memberProfileId } = req.params;
    const trainerUserId = req.user.id;
    const { notes } = req.body;

    const result =
      await trainerService.recordPersonalTrainingAttendance(
        memberProfileId,
        trainerUserId,
        notes,
      );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getMyProfile,
  getSchedule,
  getClassRoster,
  getMemberHealthProfile,
  getWorkoutTemplates,
  getMealPlans,
  assignPlan,
  getClientFeedback,
  recordPersonalTrainingAttendance,
};
