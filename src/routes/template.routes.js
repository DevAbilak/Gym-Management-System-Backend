const express = require('express');
const templateController = require('../controllers/template.controller');
const { authenticate } = require('../middleware/auth.middleware');
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
  validateUpdateWorkoutTemplate,
  templateController.updateWorkoutTemplate,
);

router.delete(
  '/workout/:id',
  validateDeleteWorkoutTemplate,
  templateController.deleteWorkoutTemplate,
);

// ============================================================
// MEAL PLANS
// ============================================================

router.post('/meal', validateCreateMealPlan, templateController.createMealPlan);

router.get('/meal', validateGetMealPlans, templateController.getMealPlans);

router.get(
  '/meal/:id',
  validateGetMealPlanById,
  templateController.getMealPlanById,
);

router.patch(
  '/meal/:id',
  validateUpdateMealPlan,
  templateController.updateMealPlan,
);

router.delete(
  '/meal/:id',
  validateDeleteMealPlan,
  templateController.deleteMealPlan,
);

module.exports = router;
