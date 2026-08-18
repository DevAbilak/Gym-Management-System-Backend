const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');
const memberController = require('../controllers/member.controller');
const {
  validateDeactivateUser,
} = require('../middleware/validators.middleware');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// ------- USER MANAGEMENT ---------
// register any user with roles: member,trainer,reception
router.post('/register', adminController.adminRegister);

// ------- MEMBER MANAGEMENT ---------
// get all members
router.get('/members', memberController.getAllMembers);

// deactivate member
router.patch(
  '/members/:id/deactivate',
  validateDeactivateUser,
  memberController.deactivateMember,
);

// reactivate member
router.patch(
  '/members/:id,reactivate',
  validateDeactivateUser,
  memberController.reactivateMember,
);

module.exports = router;
