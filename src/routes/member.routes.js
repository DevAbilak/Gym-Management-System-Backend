const express = require('express');
const memberController = require('../controllers/member.controller');

const router = express.Router();

router.get('/:id', memberController.getMemberById);
router.get('/', memberController.getAllMembers);
router.get('/unique/:uniqueId', memberController.getMemberByUniqueId);
router.get('/user/:userId', memberController.getMemberByUserId);
router.patch('/:id', memberController.updateMember);

module.exports = router;
