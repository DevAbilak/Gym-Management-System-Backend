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

module.exports = {
  createTestUser,
  loginUser,
  getAuthToken,
  createAuthenticatedUser,
};
