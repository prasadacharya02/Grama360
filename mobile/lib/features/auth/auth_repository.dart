import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';

import 'app_session.dart';

class AuthRepository {
  AuthRepository({required FirebaseAuth firebaseAuth, required Dio dio})
      : _firebaseAuth = firebaseAuth,
        _dio = dio;

  final FirebaseAuth _firebaseAuth;
  final Dio _dio;

  Future<AppSession> syncSession(String languageCode) async {
    final response = await _dio.post<Object?>(
      'auth/session',
      data: {'preferredLanguage': languageCode},
    );
    return AppSession.fromJson(response.data);
  }

  Future<AppSession> addRole(String role) async {
    final response = await _dio.put<Object?>(
      'me/roles',
      data: {'role': role},
    );
    return AppSession.fromJson(response.data);
  }

  Future<void> signOut() => _firebaseAuth.signOut();
}
