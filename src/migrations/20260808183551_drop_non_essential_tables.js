exports.up = async function (knex) {
  // ---------- DROP TABLES ----------
  await knex.raw(`DROP TABLE IF EXISTS rating_highlights CASCADE;`);
  console.log("Dropped rating_highlights");

  await knex.raw(`DROP TABLE IF EXISTS payment_webhooks CASCADE;`);
  console.log("Dropped payment_webhooks");

  await knex.raw(`DROP TABLE IF EXISTS email_logs CASCADE;`);
  console.log("Dropped email_logs");

  await knex.raw(`DROP TABLE IF EXISTS system_settings CASCADE;`);
  console.log("Dropped system_settings");

  await knex.raw(`DROP TABLE IF EXISTS audit_logs CASCADE;`);
  console.log("Dropped audit_logs");

  await knex.raw(`DROP TABLE IF EXISTS notifications CASCADE;`);
  console.log("Dropped notifications");
};

// ---------- ROLLBACK (Re-create dropped tables) ----------
exports.down = async function (knex) {
  // 1. Re-create rating_highlights
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS rating_highlights (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trainer_id UUID UNIQUE NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
      average_rating DECIMAL(3,2),
      total_reviews INTEGER DEFAULT 0,
      five_star_count INTEGER DEFAULT 0,
      four_star_count INTEGER DEFAULT 0,
      three_star_count INTEGER DEFAULT 0,
      two_star_count INTEGER DEFAULT 0,
      one_star_count INTEGER DEFAULT 0,
      last_calculated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_rating_highlights_trainer ON rating_highlights(trainer_id);
  `);
  console.log("Re-created rating_highlights (rollback).");

  // 2. Re-create payment_webhooks
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS payment_webhooks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_id UUID REFERENCES invoices(id),
      raw_payload JSONB NOT NULL,
      event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('payment.success', 'payment.failed')),
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
      processed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_payment_webhooks_invoice ON payment_webhooks(invoice_id);
  `);
  console.log("Re-created payment_webhooks (rollback).");

  // 3. Re-create email_logs
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipient_email VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      content TEXT,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
      sendgrid_message_id VARCHAR(100),
      error_message TEXT,
      sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_email_logs_user ON email_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
  `);
  console.log("Re-created email_logs (rollback).");

  // 4. Re-create system_settings
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      setting_key VARCHAR(100) UNIQUE NOT NULL,
      setting_value JSONB NOT NULL,
      description TEXT,
      updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
  `);
  console.log("Re-created system_settings (rollback).");

  // 5. RE-CREATE AUDIT LOGS
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50),
      entity_id UUID,
      changes JSONB,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `);
  console.log("Re-created audit_logs (rollback).");

  // 6. RE-CREATE NOTIFICATIONS
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      read_at TIMESTAMPTZ,
      priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
      data JSONB DEFAULT '{}' NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(created_at);
  `);
  console.log("Re-created notifications (rollback).");
};
