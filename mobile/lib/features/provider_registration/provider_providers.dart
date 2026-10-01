import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_providers.dart';
import 'provider_models.dart';
import 'provider_repository.dart';

final firebaseStorageProvider = Provider<FirebaseStorage>(
  (ref) => FirebaseStorage.instance,
);

final providerRepositoryProvider = Provider<ProviderRepository>(
  (ref) => ProviderRepository(
    dio: ref.watch(apiClientProvider).dio,
    getStorage: () => ref.read(firebaseStorageProvider),
  ),
);

final providerCategoriesProvider =
    FutureProvider.autoDispose.family<List<ServiceCategory>, String>(
  (ref, languageCode) =>
      ref.watch(providerRepositoryProvider).loadCategories(languageCode),
);

final myProviderProfileProvider =
    FutureProvider.autoDispose.family<ProviderProfile?, String>(
  (ref, _) => ref.watch(providerRepositoryProvider).loadMyProfile(),
);
