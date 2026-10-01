import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/locale_controller.dart';
import '../../l10n/generated/app_localizations.dart';

class LanguageAction extends ConsumerWidget {
  const LanguageAction({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppLocalizations.of(context);
    final selectedLanguage = ref.watch(appLocaleProvider)?.languageCode ?? 'en';

    return PopupMenuButton<String>(
      tooltip: strings.changeLanguage,
      icon: const Icon(Icons.language),
      onSelected: (languageCode) {
        unawaited(ref.read(appLocaleProvider.notifier).selectLanguage(languageCode));
      },
      itemBuilder: (context) => [
        PopupMenuItem(
          value: 'kn',
          child: _LanguageMenuItem(
            label: 'ಕನ್ನಡ',
            selected: selectedLanguage == 'kn',
          ),
        ),
        PopupMenuItem(
          value: 'en',
          child: _LanguageMenuItem(
            label: 'English',
            selected: selectedLanguage == 'en',
          ),
        ),
      ],
    );
  }
}

class _LanguageMenuItem extends StatelessWidget {
  const _LanguageMenuItem({required this.label, required this.selected});

  final String label;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: Text(label)),
        if (selected) const Icon(Icons.check_rounded, size: 20),
      ],
    );
  }
}
