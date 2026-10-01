import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:image_picker/image_picker.dart';

import 'provider_models.dart';

class ProviderRepository {
  ProviderRepository({
    required Dio dio,
    required FirebaseStorage Function() getStorage,
  })  : _dio = dio,
        _getStorage = getStorage;

  final Dio _dio;
  final FirebaseStorage Function() _getStorage;

  Future<List<ServiceCategory>> loadCategories(String languageCode) async {
    final response = await _dio.get<Object?>(
      'categories',
      queryParameters: {'language': languageCode},
    );
    final data = _asMap(response.data);
    final categories = data['categories'];
    if (categories is! List) {
      throw const FormatException('The service categories response is invalid.');
    }
    return categories.map(ServiceCategory.fromJson).toList(growable: false);
  }

  Future<ProviderProfile?> loadMyProfile() async {
    try {
      final response = await _dio.get<Object?>('provider-profiles/me');
      return ProviderProfile.fromJson(response.data);
    } on DioException catch (exception) {
      final responseData = exception.response?.data;
      final responseBody = responseData is Map ? responseData : null;
      final error = responseBody?['error'];
      final code = error is Map ? error['code'] : null;
      if (exception.response?.statusCode == 404 &&
          code == 'PROVIDER_PROFILE_NOT_FOUND') {
        return null;
      }
      rethrow;
    }
  }

  Future<ProviderProfile> createProfile(Map<String, Object?> input) async {
    final response = await _dio.post<Object?>('provider-profiles', data: input);
    return ProviderProfile.fromJson(response.data);
  }

  Future<ProviderProfile> updateProfile(Map<String, Object?> input) async {
    final response = await _dio.patch<Object?>(
      'provider-profiles/me',
      data: input,
    );
    return ProviderProfile.fromJson(response.data);
  }

  Future<String> uploadProfilePhoto(String firebaseUid, XFile image) async {
    final Uint8List bytes = await image.readAsBytes();
    if (bytes.isEmpty || bytes.length > 5 * 1024 * 1024) {
      throw const FormatException('The profile photo must be under 5 MB.');
    }

    final reference = _getStorage()
        .ref()
        .child('provider-profiles/$firebaseUid/profile.jpg');
    await reference.putData(
      bytes,
      SettableMetadata(contentType: 'image/jpeg'),
    );
    return reference.fullPath;
  }
}

Map<String, dynamic> _asMap(Object? value) {
  if (value is! Map) throw const FormatException('Invalid API response.');
  try {
    return Map<String, dynamic>.from(value);
  } on TypeError {
    throw const FormatException('Invalid API response.');
  }
}
