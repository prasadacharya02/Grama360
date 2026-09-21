# Grama360 — ಗ್ರಾಮ360

**Your village services, one contact. · ನಿಮ್ಮ ಊರಿನ ಸೇವೆಗಳು ಒಂದೇ ಸಂಪರ್ಕದಲ್ಲಿ.**

A rural service-discovery network for the **Brahmavara – Mandarthi** pilot (Udupi district, Karnataka).
Local service providers — auto drivers, electricians, plumbers, tractor owners, coconut climbers,
tailors, tutors, shops — **register themselves** in the app. Customers search *"auto driver"* (or say
*"ನನಗೆ ಆಟೋ ಬೇಕು"*) and get a list of people who are **available right now**, with a one-tap **Call** button.

> Technology works in the background, while rural people simply communicate naturally.

## Three ways people use Grama360

| Who | How | Where it lives in the code |
|-----|-----|----------------------------|
| 📞 **Keypad-phone users** | Call the single Grama360 number and say what they need. The operator finds the nearest available provider and connects them. | **Operator desk** (`src/components/Admin/OperatorDesk.tsx`) — type/dictate what the caller said, get matching providers + a Kannada read-out script, log the request in one tap. |
| 📱 **Smartphone users** | Open the app (installable from the browser on Android), search or **speak in Kannada**, tap **Call**. | Customer home & search (`src/components/Customer/`), voice input via the phone's own speech recognition (`src/hooks/useSpeechInput.ts`). |
| 🏪 **People without digital knowledge** | Visit a Grama360 representative, who uses the operator desk on their behalf. | Same operator desk, channel = *walk-in*. |

All three channels query the **same provider database** through the same search function
(`src/utils/match.ts` → `searchProviders`). A WhatsApp bot or IVR later plugs into exactly that function.

## What the app does today

**Provider side**
- Self-registration in 3 short steps: *What work do you do?* → *About you* (name, number customers should call, WhatsApp) → *Where do you work?* (village, villages you go to, hours, experience, note). Free listing.
- Big one-tap status toggle: 🟢 **Available for work** · 🟡 **Busy** · ⚪ **Not working today**.
- Dashboard shows "how customers see you", verification status, reviews, customers connected to you, share-my-card, add another service (one person can be both an auto driver and a goods-vehicle owner).

**Customer side**
- Search by occupation, name, village or a natural sentence in English/Kannada — *"plumber kota"*, *"ಕರೆಂಟ್ ಹೋಗಿದೆ"*, *"ಬ್ರಹ್ಮಾವರದಿಂದ ಮಂದಾರ್ತಿಗೆ ಆಟೋ ಬೇಕು"* all work.
- Results ranked **available → verified → rating**; village filter; "available now only" toggle.
- Provider card: name, occupation, village, status, badges, rating, **📞 Call · 98453 60001**, WhatsApp.
- Profile page with details, verification explanation, reviews (write inline), report profile.
- Emergency numbers (112 / 108 / 100 / 101 / Elder Line 14567) and the Grama360 helpline for people without the app.

**Trust & safety**
- OTP phone login (demo code `123456`). New providers are **Phone Verified** immediately; a Grama360 representative upgrades them to **⭐ Grama360 Verified** from the admin dashboard.
- 🏆 **Highly rated** badge (≥ 4.5 with 2+ reviews), community reviews and reports.

**Operations (admin / operator)**
- Live stats: providers, available now, requests this month, customers.
- Operator desk for calls / WhatsApp / walk-ins with Kannada read-out scripts.
- **Service request log** — the pilot's "Google Sheet": every request, channel, caller, provider connected, status, and the potential commission at ₹100/request.
- Demand-vs-supply chart per service so you know which providers to recruit next.

**Everything is bilingual** (English / ಕನ್ನಡ) — toggle from the top bar at any time.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 — also reachable from phones on the same Wi-Fi
npm run build      # single-file dist/index.html + manifest + icon (host anywhere: Netlify, Vercel, Nginx)
npm run preview
```

**Demo logins** (bottom of the login screen): *Customer* (Ganapathi Bhat), *Provider* (Ravi, auto driver, Brahmavara), *Operator / Admin*.
Or log in with any 10-digit number + OTP `123456` — a new number becomes a new user and can register as a provider.

Data is stored in the browser's `localStorage` (`grama360:v2`), so providers you register during
field testing survive a refresh. *Admin → Reset demo data* restores the seed.

On Android Chrome, *Menu → Add to Home screen* installs Grama360 as an app (web manifest included).

## Project structure

```
src/
  App.tsx                    router + app frame (header, bottom nav, toast)
  store.tsx                  shared state (React Context) + localStorage persistence
  i18n.ts                    every UI string in English and Kannada
  types.ts                   User, ProviderProfile, ServiceCategory, Review, Report, ServiceRequest
  data/catalog.ts            service categories (+ Kannada keywords), pilot villages, emergency numbers
  data/seed.ts               demo providers/customers/requests for Brahmavara–Mandarthi
  utils/match.ts             intent parser + searchProviders (shared by app, operator desk, future IVR/WhatsApp)
  utils/format.ts            phone formatting (E.164 ↔ "98453 60001"), tel:/wa.me links, village labels
  hooks/useSpeechInput.ts    Kannada/English voice input (Web Speech API)
  components/
    Splash / LanguageSelect / Auth / Shell (header + bottom nav) / ProviderCard / ui
    Customer/  Home, Search, SearchBar
    Provider/  ProviderForm (register + edit), Dashboard, PublicProfile
    Admin/     Dashboard, OperatorDesk, RequestsLog
docs/IVR-API.md              how the call-centre / IVR / WhatsApp channels reuse the same data & matcher
public/manifest.webmanifest  installable web app
```

## Data model

```
users              id, name, phone_number (E.164), role, language, verified
provider_profiles  id, user_id, name, phone_number, category_id, village, district, service_area[],
                   experience_years, description, working_hours, has_whatsapp,
                   availability_status (AVAILABLE_NOW|BUSY|OFFLINE),
                   verification_status (PENDING|PHONE_VERIFIED|GRAMA360_VERIFIED), rating, review_count
service_categories id, name, kannada_name, icon, group, keywords[]
reviews            id, customer_id, provider_id, rating, comment
reports            id, reporter_id, provider_id, reason, status
service_requests   id, channel (app|call|whatsapp|walk_in), caller_name, caller_phone, village,
                   category_id, note, provider_id, status (OPEN|CONNECTED|COMPLETED|CANCELLED)
```

The store is shaped like the future REST API, so swapping `localStorage` for a backend is mechanical:

```
GET   /providers?category=auto&village=Brahmavara&available=true
POST  /providers                       PATCH /providers/:id/availability
POST  /reviews                         POST  /reports
POST  /requests                        PATCH /requests/:id
PATCH /providers/:id/verification      (admin)
```

## Business model (unchanged from the plan)

Free basic listing → ⭐ Verified listing → 🚀 Premium visibility → 🏪 Business profiles → small
commission on completed requests once the network is dense. The request log already computes
*requests this month × ₹100* so the pilot can be measured from day one.

## How the code maps to the 7-day pilot plan

| Day | Plan | In the app |
|-----|------|-----------|
| 1 | Find 10 real problems | Log them in the **request log** (channel: walk-in) — demand chart shows what to launch first |
| 2 | Identify 5 electricians / 5 plumbers / 5 agri providers | Hand them your phone: **Register my service** takes 2 minutes |
| 3 | Pick agriculture *or* home services | Categories are grouped by pillar; hide the rest by editing `data/catalog.ts` if you want |
| 4 | WhatsApp Business profile | Provider cards and profiles already deep-link to WhatsApp (`wa.me`) |
| 5 | One calling number | Set `GRAMA360_HELPLINE` in `data/catalog.ts` |
| 6 | Test with 10 people | Kannada UI + voice search; watch what they type/say and add those words to `keywords` |
| 7 | Small pilot launch | Operator desk + request log replace the Google Sheet |

## Next steps (post-pilot)

1. **Backend**: Supabase/PostgreSQL behind the same store interface; Firebase/Supabase phone OTP for real SMS.
2. **WhatsApp Business API** bot: forward the message text to `parseIntent` + `searchProviders`, reply with the top 3 cards.
3. **IVR** (Exotel / Knowlarity): Kannada menu → same search → read out the top result (see `docs/IVR-API.md`).
4. **Android app**: wrap the web build with Capacitor / TWA for the Play Store; push notifications for providers.
5. **Location**: optional GPS on providers for distance-based ranking beyond village names.

---

Built for rural Karnataka: large touch targets, high contrast, Kannada first, works on low bandwidth, no email required.
