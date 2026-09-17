# FitAddis — Gym Management System (Backend)

A production-ready, scalable backend for a modern gym management platform — built with Node.js, Express, PostgreSQL, MongoDB, and Redis.

![Node.js](https://img.shields.io/badge/Node.js-v22-339933?logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?logo=redis&logoColor=white)
![CI](https://github.com/DevAbilak/Gym-Management-System-Backend/actions/workflows/ci.yml/badge.svg)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Architecture](#️-architecture)
- [Database Design](#️-database-design)
- [Project Structure](#-project-structure)
- [Installation & Setup](#️-installation--setup)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contact](#-contact)

---

## 🔍 Overview

FitAddis is a complete gym management system designed to handle the full lifecycle of gym operations — from member onboarding and class bookings to trainer workspaces, subscription payments, and admin analytics.

It is built for speed, correctness, and scale, using a hybrid database architecture (PostgreSQL for transactional data, MongoDB for flexible documents) and Redis for caching and rate limiting.

**What it powers**

- 🧑‍🤝‍🧑 Member onboarding, subscriptions, and profiles
- 📅 Class booking with real-time capacity and waitlist auto-promotion
- 🏋️ Sub-second member check-in via unique gym ID
- 🧑‍🏫 Trainer workspace (schedules, rosters, workout & meal plan assignments)
- 📈 Health tracking and progress logging
- 🔔 In-app notifications and feedback ratings
- 📊 Admin dashboard with real-time KPIs
- 💳 Secure payment processing via StarPay (Ethiopia)

---

## ✨ Features

### 👤 Auth & Members
- JWT-based authentication with refresh tokens stored in Redis
- Role-based access control (Admin, Trainer, Member, Reception)
- Unified registration with role-specific profile creation
- Member profile with unique gym ID (`GYM-XXXX-X`)

### 📅 Classes & Bookings
- Class scheduling with capacity management
- Atomic booking with waitlist auto-promotion
- Cancellation / reschedule policy (2-hour window)
- Redis-cached class listings for <1s response times

### 🏋️ Trainer Workspace
- Trainer schedule and roster views
- Workout & meal plan templates stored in MongoDB
- Plan assignment to members with automatic notifications
- Client feedback and progress tracking

### 💳 Payments & Subscriptions
- StarPay integration (sandbox & production ready)
- Pending → Active subscription flow via webhooks
- Invoice generation on successful payment
- Flexible membership tiers (Monthly, 6-Month, Yearly)

### 📊 Admin Dashboard
- Real-time KPIs: active members, daily check-ins, MRR, ratings
- Member and trainer management (soft delete / reactivate)
- Flagged ratings moderation

### 📈 Health & Progress
- Health metrics (weight, BMI, body fat) stored in MongoDB
- Progress logging with historical tracking
- Trainers can log progress for assigned members

### 🔔 Notifications
- In-app notifications for bookings, cancellations, plan assignments
- Configurable priority and flexible JSONB payloads

---

## 🛠️ Tech Stack

| Category               | Technology              |
|-------------------------|--------------------------|
| Runtime                 | Node.js (v22)            |
| Framework                | Express.js               |
| Relational DB            | PostgreSQL (Neon)        |
| Document DB              | MongoDB (Atlas)          |
| Cache & Rate Limiting    | Redis (Upstash)          |
| Query Builder            | Knex.js                  |
| Mongo ODM                | Mongoose                 |
| Authentication           | JWT, bcrypt              |
| Payments                 | StarPay API               |
| Email                    | Brevo (Sendinblue)        |
| Logging                  | Pino (structured JSON)    |
| API Docs                 | Swagger / OpenAPI 3.0     |
| CI/CD                    | GitHub Actions            |
| Hosting                  | Render                    |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       Frontend (React)                       │
└───────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────┐
│                      Express.js API Layer                    │
│                                                                │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────────┐     │
│  │  Auth   │ Members │ Classes │Bookings │  Check-in   │     │
│  ├─────────┼─────────┼─────────┼─────────┼─────────────┤     │
│  │Trainers │ Health  │Templates│Progress │  Ratings    │     │
│  ├─────────┼─────────┼─────────┼─────────┼─────────────┤     │
│  │  Admin  │  KPIs   │Subscrip.│ Payments│Notifications│     │
│  └─────────┴─────────┴─────────┴─────────┴─────────────┘     │
└───────────────┬─────────────────┬─────────────────┬──────────┘
                │                 │                 │
                ▼                 ▼                 ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │  PostgreSQL  │  │   MongoDB    │  │    Redis     │
        │    (Neon)    │  │   (Atlas)    │  │  (Upstash)   │
        │              │  │              │  │              │
        │ • Users      │  │ • Health     │  │ • Caching    │
        │ • Members    │  │ • Workouts   │  │ • Rate Limit │
        │ • Trainers   │  │ • Meals      │  │ • Refresh    │
        │ • Subscript. │  │ • Notificat. │  │   Tokens     │
        │ • Classes    │  │              │  │ • Payment    │
        │ • Bookings   │  │              │  │   Mapping    │
        │ • Attendance │  │              │  │              │
        │ • Ratings    │  │              │  │              │
        │ • Invoices   │  │              │  │              │
        └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🗄️ Database Design

### PostgreSQL (Relational)
- 18+ tables with UUID primary keys and proper foreign key constraints
- Indexes optimized for frequent queries (check-in, class listings, subscriptions)
- Partial unique index for active bookings (confirmed / waitlisted)

### MongoDB (Document)
- 4 collections: `health_metrics`, `workout_templates`, `meal_plans`, `notifications`
- Embedded documents for exercises and meal items
- UUID references to PostgreSQL records

### Redis (Cache)

| Data                          | TTL      |
|--------------------------------|----------|
| Member profiles                | 5 min    |
| Class listings                 | 1 min    |
| Trainer schedules & rosters    | 5 min    |
| Admin KPIs                     | 5 min    |
| Refresh tokens                 | 7 days   |
| Password reset tokens          | 15 min   |

---

## 📁 Project Structure

```
gym-management-backend/
├── .github/
│   └── workflows/   
│       └── ci.yml        # CI pipeline
├── src/
│   ├── config/           # Redis, MongoDB, env config
│   ├── controllers/      # Route handlers
│   ├── db/               # Knex postgresql db initialization
│   ├── docs/             # Swagger / OpenAPI spec
│   ├── middleware/       # Auth, RBAC, rate limit, error handling
│   ├── migrations/       # Knex migrations
│   ├── models/           # Mongoose schemas & Knex queries
│   ├── routes/           # Express routers
│   ├── seeders/          # Knex seeders
│   ├── services/         # Business logic
│   ├── utils/            # Helpers (logger, jwt, validators)
│   ├── app.js            # Routes import and setup
│   └── server.js         # App entry point
├── tests/
│   ├── integration/      # Full API tests
│   ├── helpers/          # Test utilities
│   └── setup.js          # Global test setup
├── .env.example
├── .env.test.example
├── .gitignore
├── .prettierignore
├── eslint.config.js
├── jest.config.js
├── knexfile.js
├── package.json
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js v20+ (v22 recommended)
- PostgreSQL (Neon or local)
- MongoDB (Atlas or local)
- Redis (Upstash or local)

### 1. Clone the repository
```bash
git clone https://github.com/DevAbilak/Gym-Management-System-Backend.git
cd Gym-Management-System-Backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 4. Run database migrations
```bash
npx knex migrate:up
```

### 5. Seed membership tiers (optional)
```bash
npx knex seed:run
```

### 6. Start the server
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server will be available at `http://localhost:3000`.

---

## 🔐 Environment Variables

| Variable                   | Description                        | Required |
|------------------------------|-------------------------------------|----------|
| `NODE_ENV`                  | `development`, `test`, `production` | ✅ |
| `PORT`                      | Server port                         | ✅ |
| `DATABASE_URL`              | PostgreSQL connection string        | ✅ |
| `REDIS_URL`                 | Redis connection string             | ✅ |
| `MONGODB_URI`                | MongoDB connection string           | ✅ |
| `JWT_SECRET`                 | Secret for JWT signing              | ✅ |
| `APP_URL`                    | Frontend URL (for reset links)      | ✅ |
| `BREVO_API_KEY`              | Brevo email API key                 | ❌ |
| `EMAIL_FROM`                 | Sender email address                | ❌ |
| `LOG_LEVEL`                   | `info`, `debug`, `warn`, `error`     | ❌ |
| `STARPAY_API_SECRET`         | StarPay API key                     | ❌ |
| `STARPAY_CALLBACK_SECRET`    | StarPay webhook secret              | ❌ |
| `STARPAY_API_URL`             | StarPay base URL                    | ❌ |
| `STARPAY_REDIRECT_URL`       | Frontend payment success URL        | ❌ |
| `STARPAY_WEBHOOK_URL`        | Webhook endpoint URL                | ❌ |

> **Note:** StarPay variables are only required if you enable payments.

---

## 📚 API Documentation

Interactive Swagger UI is available at:

- 🔗 **Production:** https://gym-management-system-backend-xb5m.onrender.com/api-docs
- 💻 **Local:** http://localhost:3000/api-docs

### Key Endpoints

| Module    | Endpoint                        | Method | Description                  |
|-----------|----------------------------------|--------|-------------------------------|
| Auth      | `/api/v1/auth/login`             | POST   | Login and get JWT             |
| Auth      | `/api/v1/auth/register`          | POST   | Register a new user           |
| Auth      | `/api/v1/auth/refresh`           | POST   | Refresh access token          |
| Members   | `/api/v1/members/me`             | GET    | Get current member profile    |
| Classes   | `/api/v1/classes`                | GET    | List upcoming classes         |
| Bookings  | `/api/v1/bookings`               | POST   | Book a class                  |
| Check-in  | `/api/v1/checkin/:uniqueId`      | POST   | Check-in via gym ID           |
| Payments  | `/api/v1/payments/init`          | POST   | Initiate StarPay payment      |
| Admin     | `/api/v1/admin/kpis`             | GET    | Dashboard KPIs                |

### Example Request

```bash
# Login
curl -X POST https://gym-management-system-backend-xb5m.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "member@example.com",
    "password": "yourpassword"
  }'
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run integration tests only
npm run test:integration

# Run a specific test file
npm test -- tests/integration/trainers.test.js

# Run with watch mode
npm test -- --watch
```

**Test stack:** Jest + Supertest + in-memory PostgreSQL/MongoDB/Redis mocks.

---

## 🚀 Deployment

### Deploy to Render

1. Push your code to GitHub.
2. Create a new Web Service on Render.
3. Connect your repository.
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
5. Add all environment variables from `.env.example`.
6. Click **Deploy**.

### StarPay Production Setup

1. Submit business info to StarPay for Live Mode.
2. Generate production API and callback keys.
3. Update `STARPAY_API_URL` to `https://api.starpayethiopia.com`.
4. Update environment variables on Render.

---

## 💬 Contact

**Project Maintainer**

- 📧 Email: abilak0716@example.com
- 🐙 GitHub: [@DevAbilak](https://github.com/DevAbilak)
- 🌐 Live API: https://gym-management-system-backend-xb5m.onrender.com
