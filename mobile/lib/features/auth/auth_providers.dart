import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/locale_controller.dart';
import '../../core/network/api_client.dart';
import 'app_session.dart';
import 'auth_repository.dart';

final firebaseAuthProvider = Provider<FirebaseAuth>((ref) => FirebaseAuth.instance);

final firebaseAuthStateProvider = StreamProvider<User?>(
  (ref) => ref.watch(firebaseAuthProvider).authStateChanges(),
);

final apiClientProvider = Provider<ApiClient>(
  (ref) => ApiClient(firebaseAuth: ref.watch(firebaseAuthProvider)),
);

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(
    firebaseAuth: ref.watch(firebaseAuthProvider),
    dio: ref.watch(apiClientProvider).dio,
  ),
);

final appSessionProvider = FutureProvider.autoDispose.family<AppSession, String>(
  (ref, firebaseUid) async {
    final user = ref.watch(firebaseAuthProvider).currentUser;
    if (user == null || user.uid != firebaseUid) {
      throw StateError('The signed-in account changed.');
    }

    final languageCode = ref.watch(appLocaleProvider)?.languageCode ?? 'en';
    return ref.watch(authRepositoryProvider).syncSession(languageCode);
  },
);
