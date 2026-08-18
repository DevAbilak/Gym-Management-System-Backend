const express = require("express");
const subscriptionController = require("../controllers/subscription.controller");

const router = express.Router();

router.post("/", subscriptionController.createSubscription);

router.patch(
  "/:id/status",
  subscriptionController.updateSubscriptionStatus
);

router.get("/:id", subscriptionController.getSubscriptionById);

router.get(
  "/member/:memberProfileId/active",
  subscriptionController.getActiveSubscription
);

module.exports = router;