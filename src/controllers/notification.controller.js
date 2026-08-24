const notificationService = require('../services/notification.service');
const { sendError, sendSuccess, ErrorCodes } = require('../utils/response');

// HELPER FUNCTION: fetch notification and check for permission
const checkPermission = async (id, userId, userRole) => {
  const notification = await notificationService.getNotificationById(id);
  if (!notification) {
    return sendError(res, 'Notification not found', ErrorCodes.NOT_FOUND, 404);
  }

  // Permission check
  const isOwn = notification.user_id === userId;
  const isAdminReception = userRole === 'admin' || userRole === 'reception';

  if (!isOwn && !isAdminReception) {
    return sendError(
      res,
      'Access denied. You can only delete your own notifications.',
      ErrorCodes.FORBIDDEN,
      403,
    );
  }
};

const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const result = await notificationService.getUserNotifications(
      userId,
      parseInt(limit),
      parseInt(page - 1) * parseInt(limit),
    );

    return sendSuccess(
      res,
      result,
      'Notifications retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const count = await notificationService.getUnreadCount(userId);

    return sendSuccess(
      res,
      { unread_count: count },
      'Unread count retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    checkPermission(id, userId, userRole);

    const updated = await notificationService.markNotificationAsRead(id);

    req.log.info({ notificationId: id, userId }, 'Notification marked as read');

    return sendSuccess(res, updated, 'Notification marked as read', 200);
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await notificationService.markAllAsRead(userId);

    req.log.info({ userId }, 'All notifications marked as read');

    return sendSuccess(res, result, result.message, 200);
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    checkPermission(id, userId, userRole);

    const result = await notificationService.deleteNotification(id);

    req.log.warn({ notificationId: id, userId }, 'Notification deleted');

    return sendSuccess(res, result, 'Notification deleted successfully', 200);
  } catch (error) {
    next(error);
  }
};

const getUserNotifications = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await notificationService.getUserNotifications(
      userId,
      parseInt(limit),
      (parseInt(page) - 1) * parseInt(limit),
    );

    return sendSuccess(
      res,
      result,
      'User notifications retrieved successfully',
      200,
    );
  } catch (error) {
    next(error);
  }
};

const cleanupOldNotifications = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    const result = await notificationService.cleanupOldNotifications(days);

    req.log.warn(
      { days, deletedCount: result.deletedCount, userId: req.user.id },
      'Old notifications cleaned up',
    );
    return sendSuccess(res, result, result.message, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUserNotifications,
  cleanupOldNotifications,
};
