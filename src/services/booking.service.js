const knex = require('../db/db');
const crypto = require('crypto');
const { invalidateTrainerScheduleCache } = require('./trainer.service');
const { redisClient } = require('../config/redis');

const CANCEL_WINDOW_HOURS = 2;
const CACHE_TTL = 300; // 5 minutes

// HELPER FUNCTION: INVALIDATE BOOKING CACHE
const invalidateBookingCache = async (bookingId, memberProfileId) => {
  // 1.invalidate single booking cache
  await redisClient.del(`booking:${bookingId}`);

  // 2.invalidate all booking history for this particular member
  const keys = await redisClient.keys(`bookings:member:${memberProfileId}:*`);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

const bookClass = async (memberProfileId, classId) => {
  const trx = await knex.transaction();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();

  try {
    const updatedClass = await trx.raw(
      `
      UPDATE classes
      SET current_bookings = current_bookings + 1, updated_at = NOW()
      WHERE id = ? AND capacity > current_bookings
      RETURNING *  
    `,
      [classId],
    );

    let bookingId;

    // if class is full, add to wait list
    if (updatedClass.rows.length === 0) {
      const insertResult = await trx.raw(
        `
        INSERT INTO class_bookings (class_id, member_profile_id, booking_reference, status) VALUES (?,?,?,'waitlisted')
        RETURNING id
      `,
        [classId, memberProfileId, `WL-${Date.now()}-${random}`],
      );
      bookingId = insertResult.rows[0].id;

      await trx.commit();
      await invalidateBookingCache(bookingId, memberProfileId);
      await invalidateTrainerScheduleCache(updatedClass.trainer_id);
      await redisClient.del(`trainer:class:${classId}:roster`);
      return {
        status: 'waitlisted',
        message: 'Class id full. You are on the waitlist.',
      };
    }

    // insert confirmed booking if class is not full
    const insertResult = await trx.raw(
      `
      INSERT INTO class_bookings (class_id, member_profile_id, booking_reference, status) VALUES (?,?,?, 'confirmed')
      RETURNING id
    `,
      [classId, memberProfileId, `BK-${Date.now()}-${random}`],
    );
    bookingId = insertResult.rows[0].id;

    await trx.commit();
    await invalidateBookingCache(bookingId, memberProfileId);
    await invalidateTrainerScheduleCache(updatedClass.trainer_id);
    await redisClient.del(`trainer:class:${classId}:roster`);

    return {
      status: 'confirmed',
      message: 'Booking successful',
      class: updatedClass.rows[0],
    };
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};

const cancelBooking = async (bookingId) => {
  const trx = await knex.transaction();

  try {
    const bookingResult = await trx.raw(
      `
      SELECT 
        cb.id,
        cb.class_id,
        cb.member_profile_id,
        cb.status,
        c.start_time
      FROM class_bookings cb
      JOIN classes c ON cb.class_id = c.id
      WHERE cb.id = ?
    `,
      [bookingId],
    );

    const booking = bookingResult.rows[0];
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'cancelled') {
      throw new Error('Booking already cancelled');
    }

    // check cancellation window
    const now = new Date();
    const classTime = new Date(booking.start_time);
    const hoursDiff = (classTime - now) / (1000 * 60 * 60);

    if (hoursDiff < CANCEL_WINDOW_HOURS) {
      throw new Error(
        `Cancellation must be at least ${CANCEL_WINDOW_HOURS} hours before class`,
      );
    }

    // update booking status to cancelled
    await trx.raw(
      `
      UPDATE class_bookings
      SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
      WHERE id = ? 
    `,
      [bookingId],
    );

    // decrement current bookings to free a spot
    await trx.raw(
      `
      UPDATE classes
      SET current_bookings = current_bookings - 1, updated_at = NOW()
      WHERE id = ?  
    `,
      [booking.class_id],
    );

    // auto promote the oldest waitlisted member (if any)
    const waitlistResult = await trx.raw(
      `
      SELECT id, member_profile_id
      FROM class_bookings
      WHERE class_id = ? AND status = 'waitlisted'
      ORDER BY booked_at ASC
      LIMIT 1
    `,
      [booking.class_id],
    );

    if (waitlistResult.rows.length > 0) {
      const waitlisted = waitlistResult.rows[0];
      await trx.raw(
        `
        UPDATE class_bookings
        SET status = 'confirmed', updated_at = NOW()
        WHERE id = ?
      `,
        [waitlisted.id],
      );

      // increment current_bookings since the waitlisted member now occupies the freed spot
      await trx.raw(
        `
        UPDATE class_bookings
        SET current_bookings = current_bookings + 1, updated_at = NOW()
        WHERE id = ?
      `,
        [booking.class_id],
      );
    }

    await trx.commit();

    await invalidateBookingCache(bookingId, booking.member_profile_id);
    await invalidateTrainerScheduleCache(classTrainerId);
    await redisClient.del(`trainer:class:${classId}:roster`);
    return {
      message:
        waitlistResult.rows.length > 0
          ? 'Booking cancelled. Waitlist member promoted successfully.'
          : 'Booking cancelled successfully.',
    };
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};

const rescheduleBooking = async (bookingId, newClassId) => {
  const trx = await knex.transaction();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();

  try {
    const bookingResult = await trx.raw(
      `
      SELECT cb.*, c.start_time
      FROM class_bookings cb
      JOIN classes c ON cb.class_id = c.id
      WHERE cb.id = ?
    `,
      [bookingId],
    );

    const booking = bookingResult.rows[0];

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'cancelled') {
      throw new Error('Cannot reschedule a cancelled booking');
    }

    // check cancellation window for original class
    const now = new Date();
    const classTime = new Date(booking.start_time);
    const hoursDiff = (classTime - now) / (1000 * 60 * 60);
    if (hoursDiff < CANCEL_WINDOW_HOURS) {
      throw new Error(
        `Reschedule must be at least ${CANCEL_WINDOW_HOURS} hours before original class`,
      );
    }

    // check capacity for new class
    const newClassResult = await trx.raw(
      `
      SELECT capacity, current_bookings
      FROM classes WHERE id = ?
    `,
      [newClassId],
    );

    const newClass = newClassResult.rows[0];

    if (!newClass) {
      throw new Error('Target class not found');
    }

    if (newClass.current_bookings >= newClass.capacity) {
      throw new Error('Target class is full');
    }

    // update the original booking to cancelled
    await trx.raw(
      `
      UPDATE class_bookings
      SET status = 'cancelled', updated_at = NOW(), cancelled_at = NOW()
      WHERE id = ?
    `,
      [bookingId],
    );

    // decrement the original class capacity
    await trx.raw(
      `
      UPDATE classes
      SET current_bookings = current_bookings - 1, updated_at = NOW()
      WHERE id = ?
    `,
      booking.class_id,
    );

    // create new booking in new class
    const insertResult = await trx.raw(
      `
      INSERT INTO class_bookings (class_id, member_profile_id, booking_reference, status) VALUES (?,?,?,'confirmed')
      RETURNING id
    `,
      [newClassId, booking.member_profile_id, `BK-${Date.now()}-${random}`],
    );
    const newBookingId = insertResult.rows[0].id;

    // increment new class capacity
    await trx.raw(
      `
      UPDATE classes
      SET current_bookings = current_bookings + 1, updated_at = NOW()
      WHERE id = ?
    `,
      [newClassId],
    );

    await trx.commit();

    await invalidateBookingCache(bookingId, booking.member_profile_id);
    await invalidateBookingCache(newBookingId, booking.member_profile_id);
    await invalidateTrainerScheduleCache(classTrainerId);
    await redisClient.del(`trainer:class:${classId}:roster`);

    return { message: 'Booking rescheduled successfully' };
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};

const getBookingByMember = async (memberProfileId, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const cacheKey = `bookings:member:${memberProfileId}:page:${page}:limit$:${limit}`;

  // check redis
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await knex.raw(
    `
    SELECT 
      cb.id,
      cb.booking_reference,
      cb.status,
      cb.booked_at,
      cb.cancelled_at,
      c.id AS class_id,
      c.name AS class_name,
      c.start_time,
      c.end_time,
      c.location,
      u.first_name || ' ' || u.last_name AS trainer_name
    FROM class_bookings cb
    JOIN classes c ON cb.class_id = c.id
    JOIN trainers tr ON c.trainer_id = tr.id
    JOIN users u ON tr.user_id = u.id
    WHERE cb.member_profile_id = ?
    ORDER BY c.start_time DESC
    LIMIT ? OFFSET ?
  `,
    [memberProfileId, limit, offset],
  );

  const bookings = result.rows;

  // set th result in redis cache
  if (bookings) {
    await redisClient.set(cacheKey, JSON.stringify(bookings), 'EX', CACHE_TTL);
  }
  return bookings;
};

const getBookingById = async (bookingId) => {
  const cacheKey = `booking:${bookingId}`;

  // check redis
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await knex.raw(
    `
    SELECT 
      cb.*,
      c.id AS class_id,
      c.name AS class_name,
      c.start_time,
      c.end_time,
      mp.user_id AS member_user_id
    FROM class_bookings cb
    JOIN classes c ON cb.class_id = c.id
    JOIN member_profiles mp ON cb.member_profile_id = mp.id
    WHERE cb.id = ?
  `,
    [bookingId],
  );
  const booking = result.rows[0];

  // store booking in cache
  if (booking) {
    await redisClient.set(cacheKey, JSON.stringify(booking), 'EX', CACHE_TTL);
  }
  return booking;
};

module.exports = {
  bookClass,
  cancelBooking,
  rescheduleBooking,
  getBookingByMember,
  getBookingById,
  CANCEL_WINDOW_HOURS,
};
