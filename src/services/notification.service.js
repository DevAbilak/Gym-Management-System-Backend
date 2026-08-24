const Notification = require('../models/notification');
const knex = require('../db/db');

const createNotification = async (payload) => {
  const { user_id, type, title, message, link, priority, data } = payload;

  // verify user exists in PostgreSQL
  const userCheck = await knex.raw(
    `
    SELECT id FROM users WHERE id = ? 
  `,
    [user_id],
  );

  if (userCheck.rows.length === 0) {
    throw new Error(`User with ID ${user_id} does not exist`);
  }

  const notification = new Notification({
    user_id,
    type,
    title,
    message,
    link: link || null,
    priority: priority || 'normal',
    data: data || {},
    is_read: false,
  });
  await notification.save();

  return notification;
};

const getUserNotifications = async (userId, limit = 20, skip = 0) => {
  const [data, total] = await Promise.all([
    Notification.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(skip),
    Notification.countDocuments({ user_id: userId }),
  ]);

  return {
    data,
    pagination: {
      limit,
      skip,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getNotificationById = async (id) => {
  const notification = await Notification.findById(id);

  return notification;
};

const getUnreadNotifications = async (userId) => {
  return await Notification.find({ user_id: userId, is_read: false }).sort({
    created_at: -1,
  });
};

const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ user_id: userId, is_read: false });
};

const markNotificationAsRead = async (notificationId) => {
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    {
      is_read: true,
      read_at: new Date(),
    },
    { new: true },
  );

  return notification;
};

const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    {
      user_id: userId,
      is_read: false,
    },
    { is_read: true, read_at: new Date() },
  );

  return {
    message: `${result.modifiedCount} notifications marked as read`,
  };
};

const deleteNotification = async (notificationId) => {
  await Notification.findByIdAndDelete(notificationId);

  return { message: 'Notification deleted successfully' };
};

const cleanupOldNotifications = async (daysOld = 30) => {
  const cutOffDate = new Date();

  cutOffDate.setDate(cutOffDate.getDate() - daysOld);

  const result = await Notification.deleteMany({
    created_at: { $lt: cutOffDate },
    is_read: true,
  });

  return {
    message: `Cleaned up ${result.deletedCount} old notifications`,
    deletedCount: result.deletedCount,
  };
};

const deleteAllForUser = async (userId) => {
  const result = await Notification.deleteMany({
    user_id: userId,
  });

  return {
    message: `Deleted ${result.deletedCount} notifications for user ${userId}`,
    deletedCount: result.deletedCount,
  };
};

module.exports = {
  createNotification,
  getUserNotifications,
  getNotificationById,
  getUnreadNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  cleanupOldNotifications,
  deleteAllForUser,
};
