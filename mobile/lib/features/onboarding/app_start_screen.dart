import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/locale_controller.dart';
import '../../core/config/runtime_config.dart';
import '../../core/firebase/firebase_setup_state.dart';
import '../../features/auth/auth_providers.dart';
import '../../features/auth/authenticated_start_screen.dart';
import '../../features/auth/firebase_setup_screen.dart';
import '../../features/auth/phone_auth_screen.dart';
import '../../l10n/generated/app_localizations.dart';

class AppStartScreen extends ConsumerWidget {
  const AppStartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(appLocaleProvider);
    if (locale == null) return const LanguageSelectionScreen();

    final firebaseReady = ref.watch(firebaseReadyProvider);
    if (!firebaseReady || RuntimeConfig.apiBaseUrl == null) {
      return const FirebaseSetupScreen();
    }

    final authState = ref.watch(firebaseAuthStateProvider);
    return authState.when(
      loading: () => const _StartupLoadingScreen(),
      error: (_, __) => const _AuthStateErrorScreen(),
      data: (user) => user == null
          ? const PhoneAuthScreen()
          : AuthenticatedStartScreen(firebaseUid: user.uid),
    );
  }
}

class LanguageSelectionScreen extends ConsumerWidget {
  const LanguageSelectionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(appLocaleProvider.notifier);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(
                    Icons.spa_rounded,
                    size: 72,
                    color: Color(0xFF245B43),
                    semanticLabel: 'Grama360',
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Grama360',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Select your language\nಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 32),
                  FilledButton.icon(
                    onPressed: () => controller.selectLanguage('kn'),
                    icon: const Icon(Icons.language),
                    label: const Text('ಕನ್ನಡ'),
                  ),
                  const SizedBox(height: 14),
                  OutlinedButton.icon(
                    onPressed: () => controller.selectLanguage('en'),
                    icon: const Icon(Icons.language),
                    label: const Text('English'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _StartupLoadingScreen extends StatelessWidget {
  const _StartupLoadingScreen();

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(),
              const SizedBox(height: 18),
              Text(strings.sessionChecking),
            ],
          ),
        ),
      ),
    );
  }
}

class _AuthStateErrorScreen extends ConsumerWidget {
  const _AuthStateErrorScreen();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppLocalizations.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(strings.authGenericError, textAlign: TextAlign.center),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => ref.invalidate(firebaseAuthStateProvider),
                  child: Text(strings.retry),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
