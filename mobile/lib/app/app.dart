import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../l10n/generated/app_localizations.dart';
import 'locale_controller.dart';
import 'router.dart';
import 'theme.dart';

class Grama360App extends ConsumerWidget {
  const Grama360App({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'Grama360',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      locale: ref.watch(appLocaleProvider),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      routerConfig: ref.watch(routerProvider),
    );
  }
}
