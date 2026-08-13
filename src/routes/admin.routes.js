const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Admin: Register any user (member, trainer, admin, reception)
router.post('/register', adminController.adminRegister);

module.exports = router;
