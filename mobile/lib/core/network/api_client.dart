import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../config/runtime_config.dart';

class ApiClient {
  ApiClient({required FirebaseAuth firebaseAuth})
      : dio = Dio(
          BaseOptions(
            baseUrl: RuntimeConfig.apiBaseUrl!,
            connectTimeout: const Duration(seconds: 12),
            receiveTimeout: const Duration(seconds: 20),
            sendTimeout: const Duration(seconds: 12),
            headers: const {'Accept': 'application/json'},
          ),
        ) {
    dio.interceptors.add(_FirebaseIdTokenInterceptor(firebaseAuth));
  }

  final Dio dio;
}

class _FirebaseIdTokenInterceptor extends Interceptor {
  _FirebaseIdTokenInterceptor(this._firebaseAuth);

  final FirebaseAuth _firebaseAuth;

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final firebaseUser = _firebaseAuth.currentUser;
    if (firebaseUser == null) {
      handler.next(options);
      return;
    }

    try {
      // Firebase refreshes the token when necessary. Never persist or log it.
      final idToken = await firebaseUser.getIdToken();
      if (idToken != null && idToken.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $idToken';
      }
      handler.next(options);
    } catch (error) {
      handler.reject(
        DioException(
          requestOptions: options,
          error: error,
          message: 'Could not refresh the Firebase sign-in token.',
        ),
      );
    }
  }
}
