import 'package:firebase_core/firebase_core.dart';

abstract final class RuntimeConfig {
  static const firebaseApiKey = String.fromEnvironment('FIREBASE_API_KEY');
  static const firebaseAppId = String.fromEnvironment('FIREBASE_APP_ID');
  static const firebaseMessagingSenderId =
      String.fromEnvironment('FIREBASE_MESSAGING_SENDER_ID');
  static const firebaseProjectId = String.fromEnvironment('FIREBASE_PROJECT_ID');
  static const firebaseStorageBucket =
      String.fromEnvironment('FIREBASE_STORAGE_BUCKET');
  static const _configuredApiBaseUrl =
      String.fromEnvironment('GRAMA360_API_BASE_URL');

  static bool get hasFirebaseOptions =>
      firebaseApiKey.isNotEmpty &&
      firebaseAppId.isNotEmpty &&
      firebaseMessagingSenderId.isNotEmpty &&
      firebaseProjectId.isNotEmpty;

  static FirebaseOptions? get firebaseOptions {
    if (!hasFirebaseOptions) return null;
    return FirebaseOptions(
      apiKey: firebaseApiKey,
      appId: firebaseAppId,
      messagingSenderId: firebaseMessagingSenderId,
      projectId: firebaseProjectId,
      storageBucket: firebaseStorageBucket.isEmpty ? null : firebaseStorageBucket,
    );
  }

  /// A production API must use HTTPS and expose the versioned API base path.
  static String? get apiBaseUrl {
    final candidate = _configuredApiBaseUrl.trim();
    final uri = Uri.tryParse(candidate);
    if (uri == null ||
        !uri.hasAuthority ||
        uri.scheme != 'https' ||
        uri.hasQuery ||
        uri.hasFragment) {
      return null;
    }
    if (!uri.path.replaceFirst(RegExp(r'/+$'), '').endsWith('/api/v1')) return null;
    return '${candidate.replaceFirst(RegExp(r'/+$'), '')}/';
  }

  static bool get isReady => firebaseOptions != null && apiBaseUrl != null;
}
