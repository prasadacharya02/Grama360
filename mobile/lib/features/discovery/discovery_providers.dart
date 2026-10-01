import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_providers.dart';
import 'discovery_models.dart';
import 'discovery_repository.dart';

final providerDirectoryRepositoryProvider = Provider<ProviderDirectoryRepository>(
  (ref) => ProviderDirectoryRepository(dio: ref.watch(apiClientProvider).dio),
);

final discoveryCategoriesProvider =
    FutureProvider.autoDispose.family<List<DiscoveryCategory>, String>(
  (ref, languageCode) => ref
      .watch(providerDirectoryRepositoryProvider)
      .loadCategories(languageCode),
);

final providerSearchProvider = FutureProvider.autoDispose
    .family<ProviderDiscoveryPage, ProviderSearchRequest>(
  (ref, request) => ref.watch(providerDirectoryRepositoryProvider).search(request),
);

final publicProviderProfileProvider = FutureProvider.autoDispose
    .family<PublicProviderProfile, ({String providerId, String languageCode})>(
  (ref, request) => ref.watch(providerDirectoryRepositoryProvider).loadProfile(
        providerId: request.providerId,
        languageCode: request.languageCode,
      ),
);
