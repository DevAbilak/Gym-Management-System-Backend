const trainerService = require('../services/trainer.service');
const memberService = require('../services/member.service');
const knex = require('../db/db');

// HELPER FUNCTION: check if a trainer is assigned to a specific member
const isTrainerAssignedToMember = async (trainerUserId, memberProfileId) => {
  const trainer = await trainerService.getTrainerByUserId(trainerUserId);
  if (!trainer) return false;

  const result = await knex.raw(
    `
    SELECT 1 FROM member_assignments
    WHERE trainer_id = ? AND member_profile_id = ? AND is_active = true
    `,
    [trainer.id, memberProfileId],
  );
  return result.rows.length > 0;
};

// HELPER FUNCTION: check if a member is assigned to a specific trainer
const isMemberAssignedToTrainer = async (memberUserId, trainerProfileId) => {
  const member = await memberService.getMemberByUserId(memberUserId);
  if (!member) return false;

  const result = await knex.raw(
    `
    SELECT 1 FROM member_assignments
    WHERE trainer_id = ? AND member_profile_id = ? AND is_active = true  
  `,
    [trainerProfileId, member.id],
  );

  return result.rows.length > 0;
};

module.exports = { isTrainerAssignedToMember, isMemberAssignedToTrainer };
