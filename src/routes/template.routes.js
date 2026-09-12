const express = require('express');
const templateController = require('../controllers/template.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  validateCreateWorkoutTemplate,
  validateCreateMealPlan,
  validateGetMealPlans,
  validateGetMealPlanById,
  validateGetWorkoutTemplateById,
  validateGetWorkoutTemplates,
  validateUpdateMealPlan,
  validateUpdateWorkoutTemplate,
  validateDeleteMealPlan,
  validateDeleteWorkoutTemplate,
} = require('../middleware/validators.middleware');

const router = express.Router();

router.use(authenticate);

// ============================================================
// WORKOUT TEMPLATES
// ============================================================

router.post(
  '/workout',
  authorize('admin', 'trainer'),
  validateCreateWorkoutTemplate,
  templateController.createWorkoutTemplate,
);

router.get(
  '/workout',
  validateGetWorkoutTemplates,
  templateController.getWorkoutTemplates,
);

router.get(
  '/workout/:id',
  validateGetWorkoutTemplateById,
  templateController.getWorkoutTemplateById,
);

router.patch(
  '/workout/:id',
  authorize('admin', 'reception', 'trainer'),
  validateUpdateWorkoutTemplate,
  templateController.updateWorkoutTemplate,
);

router.delete(
  '/workout/:id',
  authorize('admin', 'reception', 'trainer'),
  validateDeleteWorkoutTemplate,
  templateController.deleteWorkoutTemplate,
);

// ============================================================
// MEAL PLANS
// ============================================================

router.post(
  '/meal',
  authorize('admin', 'trainer'),
  validateCreateMealPlan,
  templateController.createMealPlan,
);

router.get('/meal', validateGetMealPlans, templateController.getMealPlans);

router.get(
  '/meal/:id',
  validateGetMealPlanById,
  templateController.getMealPlanById,
);

router.patch(
  '/meal/:id',
  authorize('admin', 'reception', 'trainer'),
  validateUpdateMealPlan,
  templateController.updateMealPlan,
);

router.delete(
  '/meal/:id',
  authorize('admin', 'reception', 'trainer'),
  validateDeleteMealPlan,
  templateController.deleteMealPlan,
);

module.exports = router;
