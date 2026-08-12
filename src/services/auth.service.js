const knex = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { redisClient } = require("../config/redis");
const { RESET_PASSWORD_TEMPLATE } = require("../utils/emailTempletes");
const { sendEmail } = require("./email.service");

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET;

// REGISTER
const registerUser = async (payload) => {
  const { email, password, first_name, last_name, phone, role } = payload;

  // check if user exists
  const existing = await knex.raw(`SELECT id FROM users WHERE email = ?`, [
    email,
  ]);

  if (existing.rows.length > 0) {
    throw new Error("Email already registered");
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  // add user to db
  const result = await knex.raw(
    `
    INSERT INTO users (email, password_hash, first_name, last_name,phone, role) VALUES (?,?,?,?,?,?)
    RETURNING id, email, first_name, last_name, role
  `,
    [email, password_hash, first_name, last_name, phone, role || "member"],
  );

  return result.rows[0];
};

// LOGIN
const loginUser = async (email, password) => {
  // fetch user from db
  const result = await knex.raw(`SELECT * FROM users WHERE email = ?`, [email]);

  const user = result.rows[0];

  if (!user) {
    throw new Error("User with this email does not exist.Please register");
  }

  if (!user.is_active) {
    throw new Error("Account is deactivated");
  }

  // verify password
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error("Invalid password");
  }

  // update last login
  await knex.raw(`UPDATE users SET last_login = NOW() WHERE id = ?`, [user.id]);

  // generate tokens
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, {
    expiresIn: "7d",
  });

  // storing refresh token in redis with 7 days TTL
  await redisClient.set(`refresh:${user.id}`, refreshToken, "EX", 604800);

  return {
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

// REFRESH TOKEN
const refreshAccessToken = async (refreshToken) => {
  // verify refresh token
  const decoded = jwt.verify(refreshToken, JWT_SECRET);

  // check if it exists in redis
  const storedToken = await redisClient.get(`refresh:${decoded.id}`);

  if (storedToken !== refreshToken) {
    throw new Error("Invalid refresh token");
  }

  // get user
  const userResult = await knex.raw(
    `SELECT id, email, role FROM users WHERE id = ?`,
    [decoded.id],
  );

  const user = userResult.rows[0];
  if (!user) {
    throw new Error("User not found");
  }

  const newAccessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "15m" },
  );

  return { accessToken: newAccessToken };
};

// LOGOUT
const logoutUser = async (userId) => {
  await redisClient.del(`refresh:${userId}`);
  return { message: `Logged out successfully` };
};

// FORGOT PASSWORD
const forgotPassword = async (email) => {
  const result = await knex.raw(
    `SELECT id,email,first_name FROM users WHERE email = ?`,
    [email],
  );

  if (result.rows.length === 0) {
    return { message: "If the email exists, a reset link will be sent" };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  await redisClient.set(`reset:${email}`, resetToken, "EX", 900); //15 minutes

  const user = result.rows[0];
  const html = RESET_PASSWORD_TEMPLATE.replace(
    "{USER_NAME}",
    user.first_name,
  ).replaceAll(
    "{RESET_LINK}",
    `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`,
  );

  try {
    sendEmail(user.email, "Reset Your Password - FitAddis", html);
  } catch (error) {
    throw new Error("Failed to send reset email. Please try again later.");
  }

  return { message: "Password reset link sent to your email" };
};

// RESET PASSWORD
const resetPassword = async (email, token, newPassword) => {
  const storedToken = await redisClient.get(`reset:${email}`);

  if (storedToken !== token) {
    throw new Error("Invalid or expired reset token");
  }

  const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await knex.raw(
    `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE email = ?`,
    [password_hash, email],
  );

  await redisClient.del(`reset:${email}`);

  return { message: "Password updated successfully" };
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  forgotPassword,
  resetPassword,
};
