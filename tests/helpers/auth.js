const request = require("supertest");
const app = require("../../src/app");
const knex = require("../../src/db/db");

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

  return {
    raw: responseBody,
    user: responseBody.data?.user || responseBody.data,
    token: responseBody.data?.accessToken || null,
    refreshToken: responseBody.data?.refreshToken || null,
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

  const responseBody = res.body;

  return {
    raw: responseBody,
    user: responseBody.data?.user || responseBody.data,
    accessToken: responseBody.data?.accessToken || null,
    refreshToken: responseBody.data?.refreshToken || null,
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

module.exports = {
  createTestUser,
  loginUser,
  getAuthToken,
  createAuthenticatedUser,
};
