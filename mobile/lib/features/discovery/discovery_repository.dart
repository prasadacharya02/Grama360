import 'package:dio/dio.dart';

import 'discovery_models.dart';

class ProviderDirectoryRepository {
  ProviderDirectoryRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<List<DiscoveryCategory>> loadCategories(String languageCode) async {
    final response = await _dio.get<Object?>(
      'categories',
      queryParameters: {'language': languageCode},
    );
    final data = _asMap(response.data, 'category list');
    final categories = data['categories'];
    if (categories is! List) {
      throw const FormatException('Service categories are unavailable.');
    }
    return categories.map(DiscoveryCategory.fromJson).toList(growable: false);
  }

  Future<ProviderDiscoveryPage> search(ProviderSearchRequest request) async {
    final response = await _dio.get<Object?>(
      'providers',
      queryParameters: request.toQueryParameters(),
    );
    return ProviderDiscoveryPage.fromJson(response.data);
  }

  Future<ProviderDiscoveryPage> loadFavorites({
    required String languageCode,
    int limit = 20,
    int offset = 0,
  }) async {
    final response = await _dio.get<Object?>(
      'me/favorites',
      queryParameters: {
        'language': languageCode,
        'limit': limit,
        'offset': offset,
      },
    );
    return ProviderDiscoveryPage.fromJson(response.data);
  }

  Future<bool> setFavorite({
    required String providerId,
    required bool favorite,
  }) async {
    final response = favorite
        ? await _dio.put<Object?>('me/favorites/$providerId')
        : await _dio.delete<Object?>('me/favorites/$providerId');
    final data = _asMap(response.data, 'favorite update');
    if (data['favorite'] is! bool) {
      throw const FormatException('The favorite response is invalid.');
    }
    return data['favorite'] as bool;
  }

  Future<PublicProviderProfile> loadProfile({
    required String providerId,
    required String languageCode,
  }) async {
    final response = await _dio.get<Object?>(
      'providers/$providerId',
      queryParameters: {'language': languageCode},
    );
    final data = _asMap(response.data, 'provider profile');
    return PublicProviderProfile.fromJson(data['provider']);
  }

  Future<String> requestCallIntent(String providerId) async {
    final response = await _dio.post<Object?>('providers/$providerId/call-intent');
    final data = _asMap(response.data, 'call request');
    final phoneNumber = data['phoneNumber'];
    if (phoneNumber is! String ||
        !RegExp(r'^\+[1-9][0-9]{7,14}$').hasMatch(phoneNumber)) {
      throw const FormatException('The provider phone number is unavailable.');
    }
    return phoneNumber;
  }
}

Map<String, dynamic> _asMap(Object? value, String label) {
  if (value is! Map) throw FormatException('Invalid $label response.');
  try {
    return Map<String, dynamic>.from(value);
  } on TypeError {
    throw FormatException('Invalid $label response.');
  }
}
