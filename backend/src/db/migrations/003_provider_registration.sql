-- Provider registration additions.
-- Locality labels are stored in the language the provider entered them in;
-- a future verified location gazetteer can add the other-language spelling.
ALTER TABLE locations
  ALTER COLUMN locality_en DROP NOT NULL,
  ALTER COLUMN district_en DROP NOT NULL,
  ADD COLUMN taluk_kn TEXT;

ALTER TABLE locations
  ADD CONSTRAINT locations_locality_label_present_check CHECK (
    NULLIF(BTRIM(locality_en), '') IS NOT NULL
    OR NULLIF(BTRIM(locality_kn), '') IS NOT NULL
  ),
  ADD CONSTRAINT locations_district_label_present_check CHECK (
    NULLIF(BTRIM(district_en), '') IS NOT NULL
    OR NULLIF(BTRIM(district_kn), '') IS NOT NULL
  );

CREATE UNIQUE INDEX locations_locality_kn_district_kn_state_kn_idx
  ON locations (locality_kn, district_kn, state_kn)
  WHERE locality_kn IS NOT NULL AND district_kn IS NOT NULL;

ALTER TABLE provider_profiles
  ADD COLUMN secondary_phone_e164 TEXT
    CHECK (secondary_phone_e164 IS NULL OR secondary_phone_e164 ~ '^[+][1-9][0-9]{7,14}$');

-- Ensure location records remain address-level coarse. The profile stores a
-- village/town record, not an exact household coordinate.
