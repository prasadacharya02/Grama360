# Grama360 — Rural Service Discovery Platform (MVP)

## Architecture (Option A: Modern Web-First MVP)

```
Frontend (React + Vite + Tailwind)  ←→  Mock Data Layer (JSON/TS)
         ↓
    Future: REST API (Node/Express + PostgreSQL)
         ↓
    Future Channels: WhatsApp Bot / IVR / Call Center / Mobile App
```

**Why this architecture for the MVP?**
- React + Vite provides instant hot-reload and a polished UI experience.
- Tailwind CSS v4 with custom `earth`, `leaf`, and `amber` color tokens creates a rural, warm, high-contrast interface.
- The mock data layer simulates relational database entities (`User`, `ProviderProfile`, `ServiceCategory`, `Review`, `Report`) so a backend can be swapped in without changing the frontend.
- The `vite-plugin-singlefile` builds a self-contained `dist/index.html` that can be served statically — perfect for quick preview and deployment to platforms like Netlify, Vercel, or a simple Nginx server.

## Database Design (Planned Schema)

### Tables
- `users` — id, name, phone_number, role, language, created_at
- `provider_profiles` — id, user_id, category_id, village, district, latitude, longitude, service_radius, experience_years, description, availability_status, verification_status, rating, review_count
- `service_categories` — id, name, kannada_name, icon
- `reviews` — id, customer_id, provider_id, rating, comment, created_at
- `reports` — id, reporter_id, provider_id, reason, status, created_at
- `analytics_snapshot` — aggregate metrics for admin dashboard

### Relationships
- `provider_profiles` → `users` (user_id FK)
- `provider_profiles` → `service_categories` (category_id FK)
- `reviews` → `users` (customer_id FK) and `provider_profiles` (provider_id FK)
- `reports` → `users` (reporter_id FK) and `provider_profiles` (provider_id FK)

## Features Implemented

### Phase 1 — Foundation
- [x] Splash screen with Kannada branding (`ಗ್ರಾಮ ಸೇವೆ`)
- [x] Language selection (English / Kannada)
- [x] Mobile OTP authentication (mock: code `123456` for any number)
- [x] Role selection (Customer / Service Provider / Admin)

### Phase 2 — Discovery
- [x] Service category browsing with icons (Auto, Electrician, Plumber, Carpenter, Mechanic, Farmer, Tractor, Tutor, Shop)
- [x] Search functionality (text input for future voice integration)
- [x] Provider cards with village, rating, availability pulse indicator
- [x] Click-to-call (`tel:` links)

### Phase 3 — Provider & Verification
- [x] Provider registration form (village, district, service area, experience, working hours, description)
- [x] Real-time availability control (Available Now / Busy / Offline)
- [x] Provider profile editor
- [x] Phone Verified & Grama360 Verified badges
- [x] Ratings and reviews
- [x] Report profile functionality

### Phase 4 — Admin & Analytics
- [x] Admin dashboard with user counts, provider counts
- [x] Verification management (approve/reject pending profiles)
- [x] Report resolution (resolve/reject suspicious accounts)
- [x] Basic analytics snapshot

## API-First Design for Future Channels

The mock store (`src/store.ts`) is structured to directly map to a REST API:

```typescript
// Planned REST endpoints
GET  /api/categories
GET  /api/providers?category=&village=&available=
GET  /api/providers/:id
POST /api/reviews
POST /api/reports
PATCH /api/providers/:id/availability
PATCH /api/providers/:id/verify
```

**IVR / Call Center Integration Path:**
1. A future `call-center` module can import the same `ServiceCategory` types.
2. A voice system parses the caller's Kannada phrase (`"ನನಗೆ ಆಟೋ ಬೇಕು"`) into `category='auto'` and `village='current_location'`.
3. The operator (or automated system) queries the provider database: `GET /api/providers?category=auto&available=AVAILABLE_NOW&village=Kanakapura`.
4. The system reads the response aloud in Kannada: `"ಶಿವಣ್ಣ, ಆಟೋ ಚಾಲಕ, ಲಭ್ಯ. ಕರೆ ಮಾಡಿ: 98765 43211"`.
5. No smartphone app is required for the caller — the platform is accessible via voice.

## Running the Project

```bash
# Development server with preview
npm run dev

# Build for production (single-file output)
npm run build

# Preview the production build
npm run preview
```

The `preview` server runs on `localhost:4173` by default and serves the inlined `dist/index.html`.

## Design Principles

- **Large touch targets**: All buttons have `min-height: 56px` and generous padding.
- **High contrast**: Deep `leaf-700` green headers on light `paper` backgrounds; amber call-to-action buttons.
- **Minimal text**: Icon-first navigation with Kannada labels where appropriate.
- **No email login**: Only phone number + OTP; rural users often lack email access.
- **Single-page flow**: Very few navigation steps from splash to provider contact.

## Technology Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | React 19 + TypeScript + Vite | Fast build, type-safe |
| Styling | Tailwind CSS v4 | Rapid custom theming |
| Build | vite-plugin-singlefile | One-file deployment |
| Icons | lucide-react | Clean, scalable SVG icons |
| State | React Context (custom `useAppStore`) | No external store needed for MVP |
| Database (future) | PostgreSQL / Supabase | Relational, supports geospatial queries |
| Auth (future) | Supabase Auth / Firebase Phone Auth | OTP via SMS |

## Known Demo Limitations

- OTP is hardcoded to `123456` for demonstration.
- Provider database is mocked in-memory; no persistent backend is connected.
- Map/geolocation is simulated with static `latitude`/`longitude` fields.
- Voice search button is visible but triggers a placeholder alert for future integration.

## Next Steps (Post-MVP)

1. Replace mock store with Supabase PostgreSQL database.
2. Implement real Firebase/Supabase OTP SMS delivery.
3. Add Google Maps or OpenStreetMap integration for live location filtering.
4. Build WhatsApp Business API bot for service requests.
5. Build IVR voice parser (Kannada/English) for call-center integration.
6. Launch native Flutter Android app for wider rural reach.

---

Built with focus on rural Karnataka communities, digital accessibility, and low-bandwidth usability.
