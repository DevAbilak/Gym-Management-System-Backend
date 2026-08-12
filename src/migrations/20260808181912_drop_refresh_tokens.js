/**
 * Migration: Drop refresh_tokens table
 *
 * Advisor feedback: Refresh tokens should be stored in Redis (Upstash)
 * instead of a relational table to reduce DB load and leverage built-in TTL.
 *
 * Run: npx knex migrate:up
 * Rollback: npx knex migrate:rollback
 */
exports.up = async function (knex) {
  // ---------- DROP REFRESH TOKENS TABLE ----------
  await knex.raw('DROP TABLE IF EXISTS refresh_tokens CASCADE;');
  console.log(
    'Dropped refresh_tokens table. Now using Redis for refresh tokens.',
  );
};

exports.down = async function (knex) {
  // ---------- RE-CREATE REFRESH TOKENS TABLE (for rollback safety) ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
  `);
  console.log('Re-created refresh_tokens table (rollback).');
};
