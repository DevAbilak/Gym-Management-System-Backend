const express = require('express');
const {
  listClasses,
  getClassById,
  updateClass,
  createClass,
} = require('../controllers/class.controller');
const {
  validateCreateClass,
  validateUpdateClass,
} = require('../middleware/validators.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// public routes
router.get('/', listClasses);
router.get('/:id', getClassById);

// protected routes
router.post(
  '/',
  authenticate,
  authorize('admin', 'trainer'),
  validateCreateClass,
  createClass,
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin', 'trainer'),
  validateUpdateClass,
  updateClass,
);

module.exports = router;
