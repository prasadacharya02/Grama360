-- Grama360 core relational schema.
-- Location coordinates are village/locality centroids, not a provider's home address.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT NOT NULL UNIQUE,
  phone_e164 TEXT NOT NULL UNIQUE
    CHECK (phone_e164 ~ '^[+][1-9][0-9]{7,14}$'),
  full_name TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en'
    CHECK (preferred_language IN ('en', 'kn')),
  account_status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
  phone_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('CUSTOMER', 'PROVIDER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role)
);

-- Admin access is provisioned out-of-band; it is never self-assigned from the app.
CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
  admin_role TEXT NOT NULL CHECK (admin_role IN ('SUPER_ADMIN', 'MODERATOR', 'SUPPORT')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  mfa_enrolled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES service_categories(id) ON DELETE RESTRICT,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL CHECK (length(trim(name_en)) > 0),
  name_kn TEXT NOT NULL CHECK (length(trim(name_kn)) > 0),
  icon_key TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX service_categories_active_sort_idx
  ON service_categories (sort_order, name_en)
  WHERE is_active = TRUE;
CREATE INDEX service_categories_name_en_trgm_idx
  ON service_categories USING GIN (name_en gin_trgm_ops);
CREATE INDEX service_categories_name_kn_trgm_idx
  ON service_categories USING GIN (name_kn gin_trgm_ops);

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  locality_en TEXT NOT NULL,
  locality_kn TEXT,
  taluk_en TEXT,
  district_en TEXT NOT NULL,
  district_kn TEXT,
  state_en TEXT NOT NULL DEFAULT 'Karnataka',
  state_kn TEXT NOT NULL DEFAULT 'ಕರ್ನಾಟಕ',
  country_code CHAR(2) NOT NULL DEFAULT 'IN' CHECK (country_code = 'IN'),
  -- Optional approximate village/town centroid; never store a provider's exact home here.
  coordinates GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (locality_en, district_en, state_en)
);

CREATE INDEX locations_district_locality_idx
  ON locations (district_en, locality_en);
CREATE INDEX locations_coordinates_gist_idx
  ON locations USING GIST (coordinates)
  WHERE coordinates IS NOT NULL;

CREATE TABLE provider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  display_name TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 120),
  business_name TEXT CHECK (business_name IS NULL OR length(business_name) <= 120),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  service_radius_km NUMERIC(5, 2) NOT NULL DEFAULT 10
    CHECK (service_radius_km >= 0 AND service_radius_km <= 200),
  experience_years SMALLINT NOT NULL DEFAULT 0
    CHECK (experience_years BETWEEN 0 AND 80),
  description TEXT CHECK (description IS NULL OR length(description) <= 2000),
  profile_photo_path TEXT,
  profile_status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (profile_status IN ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'SUSPENDED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX provider_profiles_location_status_idx
  ON provider_profiles (location_id, profile_status);
CREATE INDEX provider_profiles_status_created_idx
  ON provider_profiles (profile_status, created_at DESC);

CREATE TABLE provider_services (
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE RESTRICT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider_id, category_id)
);
CREATE UNIQUE INDEX provider_services_one_primary_idx
  ON provider_services (provider_id)
  WHERE is_primary = TRUE;
CREATE INDEX provider_services_category_provider_idx
  ON provider_services (category_id, provider_id);

CREATE TABLE availability (
  provider_id UUID PRIMARY KEY REFERENCES provider_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'OFFLINE'
    CHECK (status IN ('AVAILABLE', 'BUSY', 'OFFLINE')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX availability_status_provider_idx ON availability (status, provider_id);

CREATE TABLE working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  opens_at TIME,
  closes_at TIME,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  CHECK (
    (is_closed = TRUE AND opens_at IS NULL AND closes_at IS NULL)
    OR (is_closed = FALSE AND opens_at IS NOT NULL AND closes_at IS NOT NULL AND opens_at < closes_at)
  ),
  UNIQUE (provider_id, weekday)
);

CREATE TABLE provider_languages (
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK (language_code IN ('kn', 'en', 'tcy')),
  PRIMARY KEY (provider_id, language_code)
);

CREATE TABLE verification_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE RESTRICT,
  level TEXT NOT NULL CHECK (level IN ('GRAMA360')),
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by_admin_user_id UUID REFERENCES admin_users(user_id) ON DELETE RESTRICT,
  reviewed_at TIMESTAMPTZ,
  decision_note TEXT CHECK (decision_note IS NULL OR length(decision_note) <= 1000),
  CHECK (
    (reviewed_at IS NULL AND reviewed_by_admin_user_id IS NULL)
    OR (reviewed_at IS NOT NULL AND reviewed_by_admin_user_id IS NOT NULL)
  )
);
CREATE INDEX verification_records_provider_submitted_idx
  ON verification_records (provider_id, submitted_at DESC);
CREATE INDEX verification_records_review_queue_idx
  ON verification_records (status, submitted_at)
  WHERE status = 'PENDING';

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE RESTRICT,
  customer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT CHECK (review_text IS NULL OR length(review_text) <= 1500),
  moderation_status TEXT NOT NULL DEFAULT 'VISIBLE'
    CHECK (moderation_status IN ('VISIBLE', 'HIDDEN', 'PENDING')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, customer_user_id)
);
CREATE INDEX reviews_provider_visible_created_idx
  ON reviews (provider_id, created_at DESC)
  WHERE moderation_status = 'VISIBLE';
CREATE INDEX reviews_moderation_queue_idx
  ON reviews (moderation_status, created_at)
  WHERE moderation_status <> 'VISIBLE';

CREATE TABLE favorites (
  customer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (customer_user_id, provider_id)
);
CREATE INDEX favorites_provider_idx ON favorites (provider_id);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL CHECK (
    reason IN (
      'FAKE_PROFILE', 'WRONG_PHONE', 'WRONG_OCCUPATION', 'FRAUD',
      'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'DUPLICATE_PROFILE', 'OTHER'
    )
  ),
  details TEXT CHECK (details IS NULL OR length(details) <= 2000),
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED')),
  assigned_to_admin_user_id UUID REFERENCES admin_users(user_id) ON DELETE RESTRICT,
  resolution_note TEXT CHECK (resolution_note IS NULL OR length(resolution_note) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX reports_queue_idx ON reports (status, created_at DESC);
CREATE INDEX reports_provider_created_idx ON reports (provider_id, created_at DESC);

CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(user_id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX admin_audit_logs_admin_created_idx
  ON admin_audit_logs (admin_user_id, created_at DESC);
CREATE INDEX admin_audit_logs_target_idx
  ON admin_audit_logs (target_type, target_id, created_at DESC);

-- Aggregate only; this records profile views and button taps, not call content or call history.
CREATE TABLE provider_metrics_daily (
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  profile_views INTEGER NOT NULL DEFAULT 0 CHECK (profile_views >= 0),
  call_taps INTEGER NOT NULL DEFAULT 0 CHECK (call_taps >= 0),
  PRIMARY KEY (provider_id, metric_date)
);
CREATE INDEX provider_metrics_date_idx ON provider_metrics_daily (metric_date DESC);

CREATE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER provider_profiles_set_updated_at
  BEFORE UPDATE ON provider_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER service_categories_set_updated_at
  BEFORE UPDATE ON service_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
