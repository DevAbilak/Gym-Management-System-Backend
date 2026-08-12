const memberService = require('../services/member.service');

const getAllMembers = async (req, res, next) => {
  try {
    const result = await memberService.getAllMembers();
    res.json(200).json({
      result,
    });
  } catch (error) {
    next(error);
  }
};

const getMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await memberService.getMemberById(id);
    res.json(200).json({
      result,
    });
  } catch (error) {
    next(error);
  }
};

const getMemberByUserId = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const result = await memberService.getMemberByUserId(userId);
    res.json(200).json({
      result,
    });
  } catch (error) {
    next(error);
  }
};

const getMemberByUniqueId = async (req, res, next) => {
  try {
    const { uniqueMemberId } = req.body;
    if (!uniqueMemberId) {
      res.status(400).json({
        message: 'unique member id is required',
      });
    }
    const result = await memberService.getMemberByUniqueId(uniqueMemberId);
    res.json(200).json({
      result,
    });
  } catch (error) {
    next(error);
  }
};

const updateMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await memberService.updateMember(id, req.body);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMembers,
  getMemberById,
  getMemberByUniqueId,
  getMemberByUserId,
  updateMember,
};
