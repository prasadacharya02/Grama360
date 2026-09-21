# Grama360 — API-First Design for Call Center & IVR Integration

## Vision

Grama360 is not just a smartphone app. It is a rural service database designed to be accessed by:

- **Smartphone users** (this React MVP)
- **WhatsApp users** (future bot)
- **Call-center operators** (future web dashboard)
- **IVR / Voice systems** (future automated phone system)

## Database Access Pattern

All channels access the same relational data. Example query for a Kannada caller asking `"ನನಗೆ ಆಟೋ ಬೇಕು"` (I need an auto):

```sql
SELECT * FROM provider_profiles
JOIN service_categories ON provider_profiles.category_id = service_categories.id
WHERE service_categories.kannada_name LIKE '%ಆಟೋ%'
  AND provider_profiles.availability_status = 'AVAILABLE_NOW'
  AND provider_profiles.village = 'Kanakapura';
```

## Call Center Workflow (Future)

1. **Incoming Call**: Customer calls Grama360 toll-free number.
2. **Language Detection**: Operator asks: `"ನೀವು ಯಾವ ಸೇವೆ ಬಯಸುತ್ತಿದ್ದೀರಿ?"` (Which service do you want?)
3. **Voice Search**: Customer responds: `"ಆಟೋ"` (Auto).
4. **Location Filter**: Operator asks: `"ನೀವು ಯಾವ ಗ್ರಾಮದಲ್ಲಿದ್ದೀರಿ?"` (Which village are you in?)
5. **DB Query**: Operator runs the search on the admin dashboard.
6. **Result Readback**: `"ಶಿವಣ್ಣ, ಆಟೋ ಚಾಲಕ, ಕನಕಪುರ, ಲಭ್ಯ. ಫೋನ್: 98765 43211"`

## IVR Automation Path (Future)

```typescript
// Example automated flow
const query = parseKannadaVoice(input); // "ನನಗೆ ಆಟೋ ಬೇಕು"
const category = mapKeyword(query, 'auto');
const providers = await fetch(
  `/api/providers?category=${category}&available=AVAILABLE_NOW`
);
const best = providers.sort((a,b) => b.rating - a.rating)[0];
playAudioInKannada(`
  ${best.village} ನಲ್ಲಿ ${best.name} ಲಭ್ಯ. 
  ಕರೆ ಮಾಡಿ ${best.phoneNumber}
`);
```

## Key Design Decisions for Multi-Channel Support

- **No email required**: Phone number is the universal identity across mobile, WhatsApp, and voice.
- **Category table with Kannada names**: Enables voice mapping (`"ಆಟೋ"` → `category.id='auto'`).
- **Availability status real-time**: Call-center operators must know if a provider is truly available before connecting the customer.
- **Verification badges**: Operators and automated systems can filter out unverified profiles to protect customers from fraud.
- **Report tracking**: Suspicious profiles flagged by mobile users can be reviewed by operators before they receive more calls.

## WhatsApp Integration (Future)

A WhatsApp bot can use the same REST endpoints:

```typescript
// Incoming WhatsApp message: "auto Kanakapura"
const [category, village] = message.split(' ');
const results = await fetch(`/api/providers?category=${category}&village=${village}`);
await sendWhatsAppReply(formatResults(results));
```

This architecture ensures that whether a user connects via smartphone, WhatsApp, a voice call, or a future native mobile app, the underlying service database remains identical.
