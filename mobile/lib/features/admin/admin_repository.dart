import 'package:dio/dio.dart';

import 'admin_models.dart';

class AdminRepository {
  AdminRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<AdminAccess?> loadCurrentAccess() async {
    try {
      final response = await _dio.get<Object?>('admin/me');
      return AdminAccess.fromJson(response.data);
    } on DioException catch (exception) {
      final code = _errorCode(exception);
      if (exception.response?.statusCode == 403 && code == 'ADMIN_ACCESS_REQUIRED') {
        return null;
      }
      if (code == 'ADMIN_MFA_REQUIRED' ||
          code == 'ADMIN_MFA_REAUTH_REQUIRED' ||
          code == 'ADMIN_MFA_ENROLLMENT_REQUIRED') {
        throw AdminMfaRequiredException(
          reauthenticate: code == 'ADMIN_MFA_REAUTH_REQUIRED',
          enrollmentRequired: code == 'ADMIN_MFA_ENROLLMENT_REQUIRED',
        );
      }
      rethrow;
    }
  }

  Future<AdminReviewQueue> loadPendingReviews({int limit = 25, int offset = 0}) async {
    try {
      final response = await _dio.get<Object?>(
        'admin/provider-reviews',
        queryParameters: {'limit': limit, 'offset': offset},
      );
      return AdminReviewQueue.fromJson(response.data);
    } on DioException catch (exception) {
      _throwIfMfaRequired(exception);
      rethrow;
    }
  }

  Future<void> decideProviderReview({
    required String providerId,
    required String decision,
    String? note,
  }) async {
    try {
      await _dio.post<Object?>(
        'admin/provider-reviews/$providerId/decision',
        data: {
          'decision': decision,
          if (note != null) 'decisionNote': note,
        },
      );
    } on DioException catch (exception) {
      _throwIfMfaRequired(exception);
      rethrow;
    }
  }

  void _throwIfMfaRequired(DioException exception) {
    final code = _errorCode(exception);
    if (code == 'ADMIN_MFA_REQUIRED' ||
        code == 'ADMIN_MFA_REAUTH_REQUIRED' ||
        code == 'ADMIN_MFA_ENROLLMENT_REQUIRED') {
      throw AdminMfaRequiredException(
        reauthenticate: code == 'ADMIN_MFA_REAUTH_REQUIRED',
        enrollmentRequired: code == 'ADMIN_MFA_ENROLLMENT_REQUIRED',
      );
    }
  }

  String? _errorCode(DioException exception) {
    final body = exception.response?.data;
    if (body is! Map) return null;
    final error = body['error'];
    if (error is! Map) return null;
    final code = error['code'];
    return code is String ? code : null;
  }
}
