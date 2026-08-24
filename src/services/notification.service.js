const Notification = require('../models/notification');
const knex = require('../db/db');
const { redisClient } = require('../config/redis');

const CACHE_TTL = 300; // 5 minutes

// HELPER : Generate cache keys
const cacheKeys = {
  notifications: (userId, limit, skip) => {
    const page = Math.floor(skip / limit) + 1;
    return `notification:user:${userId}:page:${page}:limit:${limit}`;
  },
  unreadCount: (userId) => `notifications:unread:${userId}`,
};

// HELPER : Invalidate notification caches for a user
const invalidateNotificationCache = async (userId) => {
  const promises = [];

  // delete unread count cache
  promises.push(redisClient.del(cacheKeys.unreadCount(userId)));

  // delete all notification list caches for this user
  const pattern = `notifications:user:${userId}:*`;
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    promises.push(redisClient.del(keys));
  }

  await Promise.all(promises);
};

// HELPER: Invalidate ALL notification caches (global)
const invalidateAllNotificationCache = async () => {
  const pattern = 'notifications:*';
  const keys = await redisClient.keys(pattern);

  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

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

  await invalidateNotificationCache(user_id);

  return notification;
};

const getUserNotifications = async (userId, limit = 20, skip = 0) => {
  const cacheKey = cacheKeys.notifications(userId, limit, skip);

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const [data, total] = await Promise.all([
    Notification.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(skip),
    Notification.countDocuments({ user_id: userId }),
  ]);

  const result = {
    data,
    pagination: {
      limit,
      skip,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  if (result) {
    await redisClient.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
  }
  return result;
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
  const cacheKey = cacheKeys.unreadCount(userId);

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return parseInt(cached, 10);
  }

  const count = await Notification.countDocuments({
    user_id: userId,
    is_read: false,
  });

  if (count) {
    await redisClient.set(cacheKey, String(count), 'EX', CACHE_TTL);
  }

  return count;
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

  await invalidateNotificationCache(notification.user_id);

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

  await invalidateNotificationCache(userId);

  return {
    message: `${result.modifiedCount} notifications marked as read`,
  };
};

const deleteNotification = async (notificationId) => {
  const result = await Notification.findByIdAndDelete(notificationId);

  await invalidateNotificationCache(result.user_id);

  return { message: 'Notification deleted successfully' };
};

const cleanupOldNotifications = async (daysOld = 30) => {
  const cutOffDate = new Date();

  cutOffDate.setDate(cutOffDate.getDate() - daysOld);

  const result = await Notification.deleteMany({
    created_at: { $lt: cutOffDate },
    is_read: true,
  });

  await invalidateAllNotificationCache();

  return {
    message: `Cleaned up ${result.deletedCount} old notifications`,
    deletedCount: result.deletedCount,
  };
};

const deleteAllForUser = async (userId) => {
  const result = await Notification.deleteMany({
    user_id: userId,
  });

  await invalidateNotificationCache(userId);

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
