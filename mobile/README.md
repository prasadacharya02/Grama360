# Grama360 Android app

This is the primary Grama360 product: a native Flutter app for Android. It is organized by feature and uses Riverpod, GoRouter, Flutter localization (English/Kannada ARB files), Firebase Phone Authentication, Firebase Storage for optional profile photos, and an authenticated REST API client. Customer/provider role assignment is server-backed. Provider self-registration and status tracking are implemented, with a native provider-review console for MFA-enabled staff; customer discovery, calling, and maps are later phases.

## Requirements

- Flutter stable SDK (Dart is included)
- Android Studio with Android SDK and a compatible JDK
- Android emulator or a physical Android device

Check the installation with:

```bash
flutter doctor
```

## Android platform files

The coding sandbox used to create this foundation does not have the Flutter SDK installed, so Flutter-generated Android Gradle files cannot be produced or verified here. From this directory, generate the Android runner and run the app checks:

```bash
flutter create --platforms=android --org com.grama360 --project-name grama360 .
flutter pub get
flutter gen-l10n
flutter analyze
flutter test
```

The generated localization source is written to `lib/l10n/generated/` from the tracked ARB files and `l10n.yaml`.

## Configure phone authentication, Storage and the API

1. Create a Firebase project and register the Android package `com.grama360.grama360` (confirm the final package name after generating the Android runner).
2. Enable **Phone** under Firebase Authentication sign-in providers. Add the debug and release SHA-1/SHA-256 fingerprints, restrict the Android API key to this package/signing certificates, and configure allowed SMS regions/quotas.
3. For staff sign-in, enable **Email/Password**, upgrade Firebase Authentication to **Identity Platform**, and enable SMS multi-factor authentication. Create staff accounts and enroll their phone second factors out of band. The admin screen does not offer staff signup or MFA enrollment. See the [Firebase Flutter MFA guide](https://firebase.google.com/docs/auth/flutter/multi-factor) for project setup.
4. Provision each staff Firebase UID in PostgreSQL (`users` and `admin_users`) out of band. Set `admin_users.enabled = TRUE` and only set `mfa_enrolled_at` after Firebase MFA enrollment succeeds. The API will require a recent MFA authentication for review reads and decisions.
5. Enable Firebase Storage and create/select its default bucket. Deploy the repository's owner-write, authenticated-read rules from the repository root:

```bash
firebase login
firebase deploy --only storage --project FIREBASE_PROJECT_ID
```

6. Copy `firebase.local.example.json` to `firebase.local.json` and fill in the Firebase app identifiers, Storage bucket name, and deployed HTTPS API URL ending in `/api/v1`.
7. Run:

```bash
flutter run --dart-define-from-file=firebase.local.json
```

The app opens a localized setup screen until Firebase initializes and a valid HTTPS API URL is supplied. For local API testing from an Android device, use a reachable HTTPS development endpoint or HTTPS tunnel; do not disable certificate validation. Firebase client identifiers are public app configuration, not server credentials. Keep `firebase.local.json` untracked. Firebase Admin credentials belong only to the backend; use Application Default Credentials locally or workload identity in production. The app intentionally refuses non-HTTPS API URLs.
