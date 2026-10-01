import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_providers.dart';
import 'admin_models.dart';
import 'admin_repository.dart';

final adminRepositoryProvider = Provider<AdminRepository>(
  (ref) => AdminRepository(dio: ref.watch(apiClientProvider).dio),
);

final adminAccessProvider =
    FutureProvider.autoDispose.family<AdminAccess?, String>((ref, firebaseUid) async {
  final user = ref.watch(firebaseAuthProvider).currentUser;
  if (user == null || user.uid != firebaseUid) {
    throw StateError('The signed-in account changed.');
  }
  return ref.watch(adminRepositoryProvider).loadCurrentAccess();
});

final pendingProviderReviewsPageProvider =
    FutureProvider.autoDispose.family<AdminReviewQueue, int>(
  (ref, offset) => ref
      .watch(adminRepositoryProvider)
      .loadPendingReviews(offset: offset),
);
