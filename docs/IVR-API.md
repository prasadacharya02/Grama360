# Grama360 — One database, many channels (app · call centre · IVR · WhatsApp)

## Vision

Grama360 is not just a smartphone app. It is a **rural service database** that must be reachable by:

- **Smartphone users** — this React app (search, voice search, tap-to-call)
- **Keypad-phone users** — a single Grama360 number answered by an operator (today) or IVR (later)
- **People without digital knowledge** — a local Grama360 representative using the operator desk
- **WhatsApp users** — a bot (future)

Every channel does the same three things: **understand the need → find available providers → connect**.

## The shared pieces (already in the code)

| Step | Module | What it does |
|------|--------|--------------|
| Understand | `src/utils/match.ts` → `parseIntent(text)` | Maps a phrase in English or Kannada to `{ categoryIds, village }` using each category's `keywords` (e.g. `"ನನಗೆ ಆಟೋ ಬೇಕು"` → `auto`; `"ಬ್ರಹ್ಮಾವರದಿಂದ ಮಂದಾರ್ತಿಗೆ ಆಟೋ ಬೇಕು"` → `auto` + `Brahmavara`). Handles Kannada suffixes (ದಿಂದ / ಗೆ / ದಲ್ಲಿ) by substring matching. |
| Find | `src/utils/match.ts` → `searchProviders(providers, filters)` | Filters by category / village / availability and ranks **available → verified → rating**, own village before neighbouring villages. |
| Connect | `store.logRequest(...)` | Records a `ServiceRequest` with `channel`, caller, need, provider connected. |

Because these are plain TypeScript modules with no React imports, a Node service for IVR or WhatsApp
can import them unchanged.

## Call-centre workflow (what the operator desk implements today)

1. **Incoming call** to the Grama360 number.
2. Operator: *"ನೀವು ಯಾವ ಸೇವೆ ಬಯಸುತ್ತಿದ್ದೀರಿ?"* — caller: *"ನನಗೆ ಟ್ರ್ಯಾಕ್ಟರ್ ಬೇಕು."*
3. Operator types (or dictates) the sentence into the **Operator desk**. The intent parser selects *Tractor / Tiller*; if the caller mentioned a village it is selected too, otherwise the operator taps it.
4. The desk lists available providers with a **read-out script**:
   > ಮಂದಾರ್ತಿದಲ್ಲಿ ರಮೇಶ್ ಪೂಜಾರಿ, ಟ್ರ್ಯಾಕ್ಟರ್ / ಟಿಲ್ಲರ್, ಈಗ ಲಭ್ಯ. ಫೋನ್: 98453 60008
5. Operator taps **Connect** → the request is logged as `CONNECTED`; later marked `COMPLETED` in the request log.
6. If nobody is available, **Log request (no one available)** records the unmet demand — that is your recruitment list.

## IVR automation path (future)

```ts
import { parseIntent, searchProviders } from '../src/utils/match';

// 1. Kannada menu or speech-to-text
const said = await recogniseKannada(callAudio);          // "ನನಗೆ ಆಟೋ ಬೇಕು"
const { categoryIds, village } = parseIntent(said);

// 2. Same ranking as the app
const providers = await db.providers.all();
const [best] = searchProviders(providers, {
  categoryId: categoryIds[0],
  village: village ?? callerVillageFromCLI(callerNumber),
  availableOnly: true,
});

// 3. Read out and bridge the call
await say(`${best.village}ದಲ್ಲಿ ${best.name}, ${kannadaName(best.categoryId)}, ಈಗ ಲಭ್ಯ.`);
await say('ಸಂಪರ್ಕಿಸಲು 1 ಒತ್ತಿ.');
if (await pressed('1')) await bridge(callerNumber, best.phoneNumber);

// 4. Log it
await db.requests.insert({ channel: 'call', callerPhone: callerNumber, categoryId: best.categoryId, providerId: best.id, status: 'CONNECTED', note: said });
```

Suggested Kannada menu for the first version (no speech recognition needed):

> ಆಟೋ ಸೇವೆಗೆ 1 ಒತ್ತಿ · ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ ಸೇವೆಗೆ 2 ಒತ್ತಿ · ಪ್ಲಂಬರ್ ಸೇವೆಗೆ 3 ಒತ್ತಿ · ಟ್ರ್ಯಾಕ್ಟರ್ ಸೇವೆಗೆ 4 ಒತ್ತಿ · ಇತರ ಸೇವೆಗಳಿಗೆ / ಆಪರೇಟರ್‌ಗೆ 0 ಒತ್ತಿ

## WhatsApp bot (future)

```ts
// Incoming message: "ನನ್ನ ಮನೆಗೆ ಪ್ಲಂಬರ್ ಬೇಕು" or a voice note transcribed to text
const intent = parseIntent(message.text);
const top = searchProviders(providers, { categoryId: intent.categoryIds[0], village: intent.village, availableOnly: true }).slice(0, 3);
await reply(top.map((p) => `🟢 ${p.name} · ${p.village}\n📞 ${formatPhone(p.phoneNumber)}`).join('\n\n'));
```

## Design decisions that make multi-channel work

- **Phone number is the identity** everywhere (app, WhatsApp, caller ID). No email.
- **Categories carry Kannada names and spoken keywords**, so voice/IVR/WhatsApp all map to the same `category.id`.
- **Availability is real-time and provider-controlled** — a directory entry is useless if the person is busy; the operator never reads out an offline provider.
- **Verification badges** let operators and bots prefer verified profiles.
- **Every connection is a `ServiceRequest`** — one table powers analytics, the commission model and the provider's "customers connected to me" view.
