exports.up = async function (knex) {
  // Enable UUID generation extension
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

  // =================================================
  // A. USERS & AUTHENTICATION
  // =================================================

  // ---------- 1. USERS ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'trainer', 'member', 'reception')),
      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    COMMENT ON TABLE users IS 'All system users across all roles';
  `);

  // ---------- 2. REFRESH_TOKENS ----------
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

  // =================================================
  // B. MEMBER PROFILES & HEALTH
  // =================================================

  // ---------- 3. MEMBER_PROFILES ----------
  await knex.raw(`
      CREATE TABLE IF NOT EXISTS member_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        unique_member_id VARCHAR(20) UNIQUE NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(20) CHECK (gender IN ('male', 'female')),
        blood_type VARCHAR(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
        fitness_goal VARCHAR(50) CHECK (fitness_goal IN ('weight_loss', 'muscle_building', 'maintenance', 'general_fitness')),
        dietary_restrictions TEXT,
        emergency_contact_name VARCHAR(100),
        emergency_contact_phone VARCHAR(20),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_member_profiles_user on member_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_member_profiles_unique_id ON member_profiles(unique_member_id);
      COMMENT ON COLUMN member_profiles.unique_member_id IS 'Human-readable ID: GYM:8829-X';
    `);

  // ---------- 4. HEALTH_METRICS ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS health_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_profile_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
      weight_kg DECIMAL(5,2) NOT NULL,
      height_cm DECIMAL(5,2) NOT NULL,
      bmi DECIMAL(4,2),
      body_fat_percentage DECIMAL(4,1),
      muscle_mass_kg DECIMAL(5,2),
      waist_cm DECIMAL(5,2),
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_health_metrics_profile ON health_metrics(member_profile_id);
    CREATE INDEX IF NOT EXISTS idx_health_metrics_date ON health_metrics(recorded_at)
  `);

  // =================================================
  // C. SUBSCRIPTIONS & MEMBERSHIPS
  // =================================================

  // ---------- 5. MEMBERSHIP_TIERS ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS membership_tiers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(50) NOT NULL CHECK ( name IN ('Basic', 'Premium', 'VIP')),
      description TEXT,
      price_monthly DECIMAL(10,2) NOT NULL,
      price_annual DECIMAL(10,2),
      max_classes_per_week INTEGER DEFAULT 0,
      includes_trainer BOOLEAN DEFAULT FALSE,
      includes_nutrition_plan BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // ---------- 6. SUBSCRIPTIONS ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_profile_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
      membership_tier_id UUID NOT NULL REFERENCES membership_tiers(id),
      status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'frozen', 'expired', 'cancelled')),
      start_date DATE NOT NULL,
      expiry_date DATE NOT NULL,
      frozen_until DATE,
      auto_renew BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_subscriptions_member ON subscriptions(member_profile_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry ON subscriptions(expiry_date);
  `);

  // =================================================
  // D. PAYMENTS & INVOICES
  // =================================================

  // ---------- 7. INVOICES ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subscription_id UUID NOT NULL REFERENCES subscriptions(id),
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'ETB',
      status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
      payment_method VARCHAR(30) CHECK (payment_method IN ('chapa', 'telebirr', 'cash')),
      payment_reference VARCHAR(100),
      due_date DATE NOT NULL,
      paid_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
  `);

  // ---------- 8. PAYMENT_WEBHOOKS ----------
  await knex.raw(`
      CREATE TABLE IF NOT EXISTS payment_webhooks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id UUID REFERENCES invoices(id),
        raw_payload JSONB NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_payment_webhooks_invoice ON payment_webhooks(invoice_id);
  `);

  // =================================================
  // E. TRAINERS & WORKOUT PLANS
  // =================================================

  // ---------- 9. TRAINERS ----------

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS trainers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id),
      specialty TEXT,
      years_of_experience INTEGER,
      certification TEXT,
      bio TEXT,
      hourly_rate DECIMAL(10,2),
      is_available BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    COMMENT ON TABLE trainers IS 'Gym staff/professional trainers';
  `);

  // ---------- 10.WORKOUT TEMPLATES  ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS workout_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
      goal_type VARCHAR(20) CHECK (goal_type IN ('weight_loss', 'muscle_building', 'endurance', 'general_fitness')),
      duration_weeks INTEGER,
      is_public BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_workout_templates_trainer ON workout_templates(trainer_id);
    CREATE INDEX IF NOT EXISTS idx_workout_templates_goal_type ON workout_templates(goal_type)
  `);

  // ---------- 11.WORKOUT EXERCISES ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS workout_exercises (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workout_template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
      exercise_name VARCHAR(100) NOT NULL,
      sets INTEGER,
      reps_per_set INTEGER,
      weight_kg DECIMAL(5,2),
      rest_seconds INTEGER,
      day_number INTEGER,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_workout_exercises_template ON workout_exercises(workout_template_id);
    CREATE INDEX IF NOT EXISTS idx_workout_exercises_days ON workout_exercises(day_number);
  `);

  // ---------- 12. MEAL PLANS ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS meal_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      goal_type VARCHAR(50) CHECK (goal_type IN ('weight_loss', 'muscle_building', 'maintenance')),
      calories_target INTEGER,
      protein_g INTEGER,
      carbs_g INTEGER,
      fat_g INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_meal_plans_trainer ON meal_plans(trainer_id);
    CREATE INDEX IF NOT EXISTS idx_meal_plans_goal_type ON meal_plans(goal_type);
  `);

  // ---------- 13. MEAL ITEMS ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS meal_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
      meal_name VARCHAR(100) NOT NULL CHECK (meal_name IN ('Breakfast', 'Lunch', 'Dinner', 'Snack')),
      food_item VARCHAR(100) NOT NULL,
      quantity VARCHAR(50),
      calories INTEGER,
      protein_g INTEGER,
      carbs_g INTEGER,
      fat_g INTEGER,
      day_number INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_meal_items_plan ON meal_items(meal_plan_id);
  `);

  // =================================================
  // F. MEMBER ASSIGNMENTS
  // =================================================

  // ---------- 14. MEMBER ASSIGNMENTS ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS member_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_profile_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
      trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
      workout_template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
      meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
      assigned_at TIMESTAMPTZ DEFAULT NOW(),
      is_active BOOLEAN DEFAULT TRUE,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_member_assignments_member ON member_assignments(member_profile_id);
    CREATE INDEX IF NOT EXISTS idx_member_assignments_trainer ON member_assignments(trainer_id);
  `);

  // ---------- 15. MEMBER PROGRESS LOGS ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS member_progress_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_assignment_id UUID NOT NULL REFERENCES member_assignments(id) ON DELETE CASCADE,
      weight_kg DECIMAL(5,2),
      body_fat_percentage DECIMAL(4,1),
      muscle_mass_kg DECIMAL(5,2),
      notes TEXT,
      logged_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_member_progress_logs_assignment ON member_progress_logs(member_assignment_id);
    CREATE INDEX IF NOT EXISTS idx_member_progress_logs_logged_at ON member_progress_logs(logged_at);
  `);

  // =================================================
  // G. CLASSES & SCHEDULING
  // =================================================

  // ---------- 16. CLASSES ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS classes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      category VARCHAR(50) CHECK (category IN ('yoga', 'pilates', 'hiit', 'spin', 'strength', 'dance', 'other')),
      difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
      capacity INTEGER NOT NULL,
      current_bookings INTEGER DEFAULT 0,
      start_time TIMESTAMPTZ NOT NULL,
      end_time TIMESTAMPTZ NOT NULL,
      location VARCHAR(100),
      is_recurring BOOLEAN DEFAULT FALSE,
      recurring_pattern VARCHAR(50),
      status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT check_end_after_start CHECK (end_time > start_time)
    );
    CREATE INDEX IF NOT EXISTS idx_classes_trainer ON classes(trainer_id);
    CREATE INDEX IF NOT EXISTS idx_classes_start_time ON classes(start_time);
    CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
    CREATE INDEX IF NOT EXISTS idx_classes_category ON classes(category);
  `);

  // ---------- 17. CLASS Bookings ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS class_bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      member_profile_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
      booking_reference VARCHAR(50) NOT NULL UNIQUE,
      status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'attended', 'no_show')),
      booked_at TIMESTAMPTZ DEFAULT NOW(),
      cancelled_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(class_id, member_profile_id)
    );
    CREATE INDEX IF NOT EXISTS class_bookings_class ON class_bookings(class_id);
    CREATE INDEX IF NOT EXISTS class_bookings_member ON class_bookings(member_profile_id);
    CREATE INDEX IF NOT EXISTS class_bookings_status ON class_bookings(status);
    CREATE INDEX IF NOT EXISTS class_bookings_booking_reference ON class_bookings(booking_reference);
  `);

  // =================================================
  // H. ATTENDANCE
  // =================================================

  // ---------- 18. ATTENDANCE RECORDS ----------

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS attendance_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_profile_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
      check_in_type VARCHAR(20) NOT NULL CHECK (check_in_type IN ('gym_entry', 'class_attendance')),
      class_booking_id UUID REFERENCES class_bookings(id) ON DELETE SET NULL,
      checked_in_at TIMESTAMPTZ DEFAULT NOW(),
      checked_out_at TIMESTAMPTZ,
      verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
      notes TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance_records(member_profile_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(checked_in_at);
    CREATE INDEX IF NOT EXISTS idx_attendance_type ON attendance_records(check_in_type);
    CREATE INDEX IF NOT EXISTS idx_attendance_class_booking ON attendance_records(class_booking_id);
  `);

  // =================================================
  // I. RATINGS & FEEDBACK
  // =================================================

  // ---------- 19. RATINGS ----------
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS ratings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_profile_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
      rating_type VARCHAR(30) NOT NULL CHECK (rating_type IN ('trainer', 'facility', 'class')),
      trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
      class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
      rating_stars INTEGER NOT NULL CHECK (rating_stars BETWEEN 1 AND 5),
      rating_dimensions VARCHAR(50),
      comment TEXT,
      is_anonymous BOOLEAN DEFAULT FALSE,
      is_moderated BOOLEAN DEFAULT FALSE,
      moderation_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT check_rating_target CHECK(
        (rating_type = 'trainer' AND trainer_id IS NOT NULL AND class_id IS NULL) OR
        (rating_type = 'class' AND class_id IS NOT NULL AND trainer_id IS NULL) OR
        (rating_type = 'facility' AND trainer_id IS NULL and class_id IS NULL)
      )
    );
    CREATE INDEX IF NOT EXISTS idx_ratings_member ON ratings(member_profile_id);
    CREATE INDEX IF NOT EXISTS idx_ratings_trainer ON ratings(trainer_id);
    CREATE INDEX IF NOT EXISTS idx_ratings_type ON ratings(rating_type);
    CREATE INDEX IF NOT EXISTS idx_ratings_date ON ratings(created_at);
  `);

  // ---------- 20. RATING HIGHLIGHTS ----------
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

  // =================================================
  // J. AUDIT LOGS
  // =================================================

  // ---------- 21. AUDIT LOGS  ----------
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
    CREATE INDEX IF NOT EXISTS idx_audit_entity_type ON audit_logs(entity_type);
    CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);
  `);

  // =================================================
  // K. NOTIFICATIONS
  // =================================================

  // ---------- 22. NOTIFICATIONS  ----------
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
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(created_at);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
`);

  // ---------- 23. EMAIL LOGS  ----------
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
  CREATE INDEX IF NOT EXISTS idx_email_date ON email_logs(created_at);
  CREATE INDEX IF NOT EXISTS idx_email_user ON email_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_email_status ON email_logs(status);
`);

  // =================================================
  // L. SYSTEM CONFIGURATION
  // =================================================

  // ---------- 24. SYSTEM SETTINGS  ----------
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
};

// ============================================================
// ROLLBACK (Reverse order to avoid FK violations)
// ============================================================
exports.down = async function (knex) {
  await knex.raw(`
    DROP TABLE IF EXISTS 
      system_settings,
      email_logs,
      notifications,
      audit_logs,
      rating_highlights,
      ratings,
      attendance_records,
      class_bookings,
      classes,
      member_progress_logs,
      member_assignments,
      meal_items,
      meal_plans,
      workout_exercises,
      workout_templates,
      trainers,
      payment_webhooks,
      invoices,
      subscriptions,
      membership_tiers,
      health_metrics,
      member_profiles,
      refresh_tokens,
      users
    CASCADE;
  `);
};
