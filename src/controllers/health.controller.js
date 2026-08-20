const healthService = require('../services/health.service');
const memberService = require('../services/member.service');
const trainerService = require('../services/trainer.service');
const { sendSuccess, sendError, ErrorCodes } = require('../utils/response');
const knex = require('../db');

// HELPER FUNCTION: Check if trainer is assigned to member
const isTrainerAssignedToMember = async (trainerUserId, memberProfileId) => {
  // Get trainer profile
  const trainer = await trainerService.getTrainerByUserId(trainerUserId);
  if (!trainer) return false;

  // Check assignment
  const result = await knex.raw(
    `
    SELECT 1 FROM member_assignments
    WHERE trainer_id = ? AND member_profile_id = ? AND is_active = true
    `,
    [trainer.id, memberProfileId],
  );
  return result.rows.length > 0;
};

const saveHealthProfile = async (req, res, next) => {
  try {
    const payload = req.body;

    const member = await memberService.getMemberById(payload.member_id);
    if (!member) {
      return sendError(res, 'Member not found', ErrorCodes.NOT_FOUND, 404);
    }
  } catch (error) {}
};
