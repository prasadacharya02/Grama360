-- Initial category tree for Karnataka MVP discovery. Names are localized in-app.
INSERT INTO service_categories (slug, name_en, name_kn, icon_key, sort_order)
VALUES
  ('transportation', 'Transportation', 'ಸಾರಿಗೆ', 'transport', 10),
  ('home-services', 'Home Services', 'ಮನೆ ಸೇವೆಗಳು', 'home_repair_service', 20),
  ('repair-services', 'Repair Services', 'ದುರಸ್ತಿ ಸೇವೆಗಳು', 'build', 30),
  ('agriculture', 'Agriculture', 'ಕೃಷಿ ಸೇವೆಗಳು', 'agriculture', 40),
  ('personal-services', 'Personal Services', 'ವೈಯಕ್ತಿಕ ಸೇವೆಗಳು', 'person', 50),
  ('local-businesses', 'Local Businesses', 'ಸ್ಥಳೀಯ ಅಂಗಡಿಗಳು', 'storefront', 60)
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_kn = EXCLUDED.name_kn,
  icon_key = EXCLUDED.icon_key,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE;

INSERT INTO service_categories (parent_id, slug, name_en, name_kn, icon_key, sort_order)
SELECT parent.id, child.slug, child.name_en, child.name_kn, child.icon_key, child.sort_order
FROM (
  VALUES
    ('transportation', 'auto-driver', 'Auto Driver', 'ಆಟೋ ಚಾಲಕ', 'local_taxi', 10),
    ('transportation', 'taxi-driver', 'Taxi Driver', 'ಟ್ಯಾಕ್ಸಿ ಚಾಲಕ', 'local_taxi', 20),
    ('transportation', 'goods-vehicle', 'Goods Vehicle', 'ಸರಕು ವಾಹನ', 'local_shipping', 30),
    ('home-services', 'electrician', 'Electrician', 'ಎಲೆಕ್ಟ್ರಿಷಿಯನ್', 'electrical_services', 10),
    ('home-services', 'plumber', 'Plumber', 'ಪ್ಲಂಬರ್', 'plumbing', 20),
    ('home-services', 'carpenter', 'Carpenter', 'ಬಡಗಿ', 'carpenter', 30),
    ('home-services', 'painter', 'Painter', 'ಬಣ್ಣದ ಕೆಲಸಗಾರ', 'format_paint', 40),
    ('home-services', 'mason', 'Mason', 'ಮೇಸ್ತ್ರಿ', 'construction', 50),
    ('repair-services', 'mechanic', 'Mechanic', 'ಮೆಕ್ಯಾನಿಕ್', 'build', 10),
    ('repair-services', 'bike-repair', 'Bike Repair', 'ಬೈಕ್ ದುರಸ್ತಿ', 'two_wheeler', 20),
    ('repair-services', 'car-repair', 'Car Repair', 'ಕಾರು ದುರಸ್ತಿ', 'car_repair', 30),
    ('repair-services', 'mobile-repair', 'Mobile Repair', 'ಮೊಬೈಲ್ ದುರಸ್ತಿ', 'phone_android', 40),
    ('repair-services', 'appliance-repair', 'Appliance Repair', 'ಗೃಹೋಪಯೋಗಿ ಉಪಕರಣಗಳ ದುರಸ್ತಿ', 'home_repair_service', 50),
    ('agriculture', 'tractor-service', 'Tractor Service', 'ಟ್ರ್ಯಾಕ್ಟರ್ ಸೇವೆ', 'agriculture', 10),
    ('agriculture', 'agricultural-machinery', 'Agricultural Machinery', 'ಕೃಷಿ ಯಂತ್ರೋಪಕರಣಗಳು', 'agriculture', 20),
    ('agriculture', 'farm-labour', 'Farm Labour', 'ಕೃಷಿ ಕಾರ್ಮಿಕರು', 'groups', 30),
    ('agriculture', 'spraying-service', 'Spraying Service', 'ಸಿಂಪಡಣೆ ಸೇವೆ', 'sprinkler', 40),
    ('agriculture', 'harvesting-service', 'Harvesting Service', 'ಕೊಯ್ಲು ಸೇವೆ', 'agriculture', 50),
    ('personal-services', 'tailor', 'Tailor', 'ಹೊಲಿಗೆ ಕೆಲಸಗಾರ', 'content_cut', 10),
    ('personal-services', 'barber', 'Barber', 'ಕ್ಷೌರಿಕ', 'content_cut', 20),
    ('personal-services', 'tutor', 'Tutor', 'ಮನೆಪಾಠ ಶಿಕ್ಷಕ', 'school', 30),
    ('local-businesses', 'grocery', 'Grocery', 'ದಿನಸಿ ಅಂಗಡಿ', 'local_grocery_store', 10),
    ('local-businesses', 'medical-store', 'Medical Store', 'ಔಷಧಿ ಅಂಗಡಿ', 'medical_services', 20),
    ('local-businesses', 'hardware-store', 'Hardware Store', 'ಹಾರ್ಡ್‌ವೇರ್ ಅಂಗಡಿ', 'hardware', 30),
    ('local-businesses', 'other-shops', 'Other Shops', 'ಇತರೆ ಅಂಗಡಿಗಳು', 'storefront', 40)
) AS child(parent_slug, slug, name_en, name_kn, icon_key, sort_order)
JOIN service_categories AS parent ON parent.slug = child.parent_slug
ON CONFLICT (slug) DO UPDATE SET
  parent_id = EXCLUDED.parent_id,
  name_en = EXCLUDED.name_en,
  name_kn = EXCLUDED.name_kn,
  icon_key = EXCLUDED.icon_key,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE;
