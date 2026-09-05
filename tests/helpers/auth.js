const request = require("supertest");
const app = require("../../src/app");
const knex = require("../../src/db/db");
const bcrypt = require("bcrypt");
const { randomUUID } = require("crypto");

// create a test user and return token
const createTestUser = async (role = "member", overrides = {}) => {
  const userData = {
    email: `test-${Date.now()}@example.com`,
    password: "TestPass123!",
    first_name: "Test",
    last_name: "User",
    phone: "+251900000000",
    role,
    ...overrides,
  };

  if (role === "member") {
    userData.date_of_birth = "1996-01-01";
    userData.gender = "male";
    userData.fitness_goal = "muscle_building";
    userData.emergency_contact_name = "Jane Doe";
    userData.emergency_contact_phone = "+251911111111";
  }

  if (role === "trainer") {
    userData.specialty = "HIIT & Strength";
    userData.years_of_experience = 5;
    userData.certification = "NSCA-CPT";
    userData.hourly_rate = 45.0;
  }

  const res = await request(app).post("/api/v1/auth/register").send(userData);

  const responseBody = res.body;
  const user = responseBody.user || responseBody.data?.user;

  // Login to get tokens
  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: userData.email, password: userData.password });

  const token = loginRes.body.data?.accessToken || loginRes.body.accessToken;
  const refreshToken =
    loginRes.body.data?.refreshToken || loginRes.body.refreshToken;

  return {
    raw: responseBody,
    user,
    token,
    refreshToken,
    password: userData.password,
    email: userData.email,
    memberProfileId:
      responseBody.data?.user?.user_id || responseBody.data?.user?.id,
    uniqueMemberId: responseBody.data?.user?.unique_member_id,
  };
};

const loginUser = async (email, password) => {
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });
  return {
    raw: res.body,
    user: res.body.data?.user || res.body.user,
    accessToken: res.body.data?.accessToken || res.body.accessToken,
    refreshToken: res.body.data?.refreshToken || res.body.refreshToken,
  };
};

const getAuthToken = async (email, password) => {
  const result = await loginUser(email, password);
  return result.accessToken;
};

const createAuthenticatedUser = async (role = "member", overrides = {}) => {
  const registered = await createTestUser(role, overrides);

  const loggedIn = await loginUser(registered.email, registered.password);

  return {
    ...registered,
    ...loggedIn,
    accessToken: loggedIn.accessToken || registered.token,
  };
};

// Create a test user directly in DB and return token
const createTestUserInDB = async (role, overrides = {}) => {
  const id = randomUUID();
  const email = overrides.email || `${role}-${Date.now()}@test.com`;
  const password = overrides.password || "TestPass123!";
  const password_hash = await bcrypt.hash(password, 12);
  const first_name =
    overrides.first_name || role.charAt(0).toUpperCase() + role.slice(1);
  const last_name = overrides.last_name || "User";
  const is_active = overrides.is_active ?? true;

  // Insert into users table
  await knex.raw(
    `
    INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id,
      email,
      password_hash,
      first_name,
      last_name,
      overrides.phone || "+251900000000",
      role,
      is_active,
    ],
  );

  let memberProfileId = null;
  let trainerProfileId = null;

  // If member, create member profile
  if (role === "member") {
    const unique_member_id = `GYM-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(Math.random() * 10)}`;
    const memberRes = await knex.raw(
      `
      INSERT INTO member_profiles (user_id, unique_member_id, date_of_birth, gender, fitness_goal, emergency_contact_name, emergency_contact_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING id
      `,
      [
        id,
        unique_member_id,
        "1996-01-01",
        "male",
        "muscle_building",
        "Jane Doe",
        "+251911111111",
      ],
    );
    memberProfileId = memberRes.rows[0].id;
  }

  // If trainer, create trainer profile
  if (role === "trainer") {
    const trainerRes = await knex.raw(
      `
      INSERT INTO trainers (user_id, specialty, years_of_experience, certification, hourly_rate)
      VALUES (?, ?, ?, ?, ?)
      RETURNING id
      `,
      [id, "HIIT & Strength", 5, "NSCA-CPT", 45.0],
    );
    trainerProfileId = trainerRes.rows[0].id;
  }

  // Login to get token
  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });

  const token = loginRes.body.data?.accessToken || loginRes.body.accessToken;

  return {
    id,
    email,
    password,
    token,
    memberProfileId,
    trainerProfileId,
  };
};

module.exports = {
  createTestUser,
  loginUser,
  getAuthToken,
  createAuthenticatedUser,
  createTestUserInDB,
};
