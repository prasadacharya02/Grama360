-- Trigram indexes keep text-based discovery responsive without requiring exact
-- spellings or a location-permission prompt.
CREATE INDEX provider_profiles_display_name_trgm_idx
  ON provider_profiles USING GIN (display_name gin_trgm_ops);
CREATE INDEX provider_profiles_business_name_trgm_idx
  ON provider_profiles USING GIN (business_name gin_trgm_ops)
  WHERE business_name IS NOT NULL;

CREATE INDEX locations_locality_en_trgm_idx
  ON locations USING GIN (locality_en gin_trgm_ops)
  WHERE locality_en IS NOT NULL;
CREATE INDEX locations_locality_kn_trgm_idx
  ON locations USING GIN (locality_kn gin_trgm_ops)
  WHERE locality_kn IS NOT NULL;
CREATE INDEX locations_taluk_en_trgm_idx
  ON locations USING GIN (taluk_en gin_trgm_ops)
  WHERE taluk_en IS NOT NULL;
CREATE INDEX locations_taluk_kn_trgm_idx
  ON locations USING GIN (taluk_kn gin_trgm_ops)
  WHERE taluk_kn IS NOT NULL;
CREATE INDEX locations_district_en_trgm_idx
  ON locations USING GIN (district_en gin_trgm_ops)
  WHERE district_en IS NOT NULL;
CREATE INDEX locations_district_kn_trgm_idx
  ON locations USING GIN (district_kn gin_trgm_ops)
  WHERE district_kn IS NOT NULL;
