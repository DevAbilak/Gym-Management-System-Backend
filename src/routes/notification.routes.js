const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { authorize, authenticate } = require('../middleware/auth.middleware');
const {
  validateGetNotifications,
  validateMarkAsRead,
  validateDeleteNotification,
  validateGetUserNotifications,
} = require('../middleware/validators.middleware');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  validateGetNotifications,
  notificationController.getMyNotifications,
);

router.get('/unread', notificationController.getUnreadCount);

router.patch('/read-all', notificationController.markAllAsRead);

router.patch(
  '/:id/read',
  validateMarkAsRead,
  notificationController.markAsRead,
);

router.delete(
  '/:id',
  validateDeleteNotification,
  notificationController.deleteNotification,
);

router.get(
  '/user/:userId',
  authorize('admin', 'reception'),
  validateGetUserNotifications,
  notificationController.getUserNotifications,
);

module.exports = router;
