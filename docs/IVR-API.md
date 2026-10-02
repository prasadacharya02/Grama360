# Future IVR and WhatsApp integration

The mobile app, a future WhatsApp bot, and any future call-center/IVR service will use the same Node/Express API and PostgreSQL provider records. Channel integrations must **not** connect directly to PostgreSQL or embed privileged credentials.

## Future flow

1. Receive a Kannada/English request (for example, `ನನಗೆ ಆಟೋ ಬೇಕು`).
2. Map the request to an active service category and ask for a village/locality if needed.
3. Call the shared provider-discovery API with category, locality, availability, and pagination filters.
4. Return only the minimum contact details required for the channel and obtain customer consent before connecting a call.
5. Log channel/action metadata without recording call content or exposing unnecessary personal data.

The API contract is tracked in [api.md](api.md). Relevant endpoints include:

```text
GET  /api/v1/categories?language=kn
GET  /api/v1/locations/search?q=...
GET  /api/v1/providers?categoryId=...&locationId=...&availability=AVAILABLE
POST /api/v1/providers/{providerId}/call-intent
```

The call-intent endpoint is designed for an authenticated app user. An IVR or operator channel should receive a separate service identity and a narrowly scoped contact workflow rather than reusing an end-user token or querying phone numbers directly.

## Not part of MVP

- No IVR, call-center UI, call recording, speech recognition, or WhatsApp integration is implemented yet; those remain future integrations after the shared APIs mature.
- The future voice system can translate phrases such as `ಆಟೋ` into category search, but language parsing is not a dependency of the database or mobile app.
- No caller should be promised a completed booking; Grama360 MVP discovery ends at the customer/provider contact handoff.
