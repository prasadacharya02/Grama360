import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/onboarding/app_start_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final router = GoRouter(
    routes: [
      GoRoute(
        path: '/',
        name: 'start',
        builder: (context, state) => const AppStartScreen(),
      ),
    ],
  );

  ref.onDispose(router.dispose);
  return router;
});
