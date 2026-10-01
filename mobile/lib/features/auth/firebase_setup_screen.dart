import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/config/runtime_config.dart';
import '../../core/firebase/firebase_setup_state.dart';
import '../../core/widgets/language_action.dart';
import '../../l10n/generated/app_localizations.dart';

class FirebaseSetupScreen extends ConsumerWidget {
  const FirebaseSetupScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppLocalizations.of(context);
    final missingFirebase = !RuntimeConfig.hasFirebaseOptions;
    final firebaseReady = ref.watch(firebaseReadyProvider);
    final missingApi = RuntimeConfig.apiBaseUrl == null;

    return Scaffold(
      appBar: AppBar(
        title: Text(strings.appTitle),
        actions: const [LanguageAction()],
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(Icons.settings_suggest_rounded, size: 64),
                  const SizedBox(height: 20),
                  Text(
                    strings.setupRequiredTitle,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    strings.setupRequiredBody,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 24),
                  if (missingFirebase || !firebaseReady)
                    _RequiredConfigCard(
                      title: strings.firebaseConfigTitle,
                      values: missingFirebase
                          ? const [
                              'FIREBASE_API_KEY',
                              'FIREBASE_APP_ID',
                              'FIREBASE_MESSAGING_SENDER_ID',
                              'FIREBASE_PROJECT_ID',
                            ]
                          : [strings.firebaseInitCheck],
                    ),
                  if (missingApi)
                    const _RequiredConfigCard(
                      title: strings.apiConfigTitle,
                      values: ['GRAMA360_API_BASE_URL (must end in /api/v1)'],
                    ),
                  const SizedBox(height: 16),
                  Text(
                    strings.setupRequiredFooter,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
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

class _RequiredConfigCard extends StatelessWidget {
  const _RequiredConfigCard({required this.title, required this.values});

  final String title;
  final List<String> values;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            for (final value in values)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: SelectableText(value),
              ),
          ],
        ),
      ),
    );
  }
}
