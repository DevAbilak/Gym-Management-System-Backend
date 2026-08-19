const express = require('express');
const memberController = require('../controllers/member.controller');
const {
  authenticate,
  authorize,
  requireOwnership,
} = require('../middleware/auth.middleware');
const {
  validateGetMemberById,
  validateGetMemberByUserId,
  validateUpdateMember,
  validateGetMemberByUniqueId,
} = require('../middleware/validators.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/me', memberController.getCurrentMember);
router.get('/:id', validateGetMemberById, memberController.getMemberById);
router.patch(
  '/:id',
  requireOwnership('id'),
  validateUpdateMember,
  memberController.updateMember,
);

// ADMIN AND RECEPTION ONLY
router.get(
  '/',
  authorize('admin', 'reception'),
  memberController.getAllMembers,
);
router.get(
  '/user/:userId',
  authorize('admin', 'reception'),
  validateGetMemberByUserId,
  memberController.getMemberByUserId,
);
router.get(
  '/unique/:uniqueId',
  authorize('admin', 'reception'),
  validateGetMemberByUniqueId,
  memberController.getMemberByUniqueId,
);

module.exports = router;
