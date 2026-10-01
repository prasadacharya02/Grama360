import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/widgets/language_action.dart';
import '../../l10n/generated/app_localizations.dart';
import '../auth/auth_providers.dart';
import 'provider_models.dart';
import 'provider_providers.dart';
import 'provider_registration_form.dart';

class ProviderRegistrationScreen extends ConsumerStatefulWidget {
  const ProviderRegistrationScreen({
    required this.firebaseUid,
    required this.primaryPhoneNumber,
    required this.initialName,
    super.key,
  });

  final String firebaseUid;
  final String primaryPhoneNumber;
  final String? initialName;

  @override
  ConsumerState<ProviderRegistrationScreen> createState() =>
      _ProviderRegistrationScreenState();
}

class _ProviderRegistrationScreenState
    extends ConsumerState<ProviderRegistrationScreen> {
  ProviderProfile? _justSavedProfile;

  void _onSaved(ProviderProfile profile) {
    setState(() => _justSavedProfile = profile);
    ref.invalidate(myProviderProfileProvider(widget.firebaseUid));
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);
    final localeCode = Localizations.localeOf(context).languageCode == 'kn'
        ? 'kn'
        : 'en';

    if (_justSavedProfile != null) {
      return _statusScaffold(context, strings, _justSavedProfile!);
    }

    final profileRequest =
        ref.watch(myProviderProfileProvider(widget.firebaseUid));
    return profileRequest.when(
      loading: () => _loadingScreen(strings),
      error: (_, __) => _problemScreen(
        context,
        title: strings.providerProfileLoadError,
        onRetry: () => ref.invalidate(myProviderProfileProvider(widget.firebaseUid)),
      ),
      data: (profile) {
        if (profile != null && _isReadOnlyStatus(profile.profileStatus)) {
          return _statusScaffold(context, strings, profile);
        }

        final categoriesRequest = ref.watch(providerCategoriesProvider(localeCode));
        return categoriesRequest.when(
          loading: () => _loadingScreen(strings),
          error: (_, __) => _problemScreen(
            context,
            title: strings.providerCategoriesLoadError,
            onRetry: () => ref.invalidate(providerCategoriesProvider(localeCode)),
          ),
          data: (categories) => ProviderRegistrationForm(
            firebaseUid: widget.firebaseUid,
            primaryPhoneNumber: widget.primaryPhoneNumber,
            initialName: widget.initialName,
            initialProfile: profile,
            categories: categories,
            onSaved: _onSaved,
          ),
        );
      },
    );
  }

  bool _isReadOnlyStatus(String status) => status != 'DRAFT' && status != 'REJECTED';

  Widget _loadingScreen(AppLocalizations strings) => Scaffold(
        appBar: _appBar(strings),
        body: SafeArea(
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
                Text(strings.providerLoading),
              ],
            ),
          ),
        ),
      );

  Widget _problemScreen(
    BuildContext context, {
    required String title,
    required VoidCallback onRetry,
  }) {
    final strings = AppLocalizations.of(context);
    return Scaffold(
      appBar: _appBar(strings),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(Icons.cloud_off_outlined, size: 56),
                  const SizedBox(height: 18),
                  Text(title, textAlign: TextAlign.center),
                  const SizedBox(height: 18),
                  FilledButton.icon(
                    onPressed: onRetry,
                    icon: const Icon(Icons.refresh_rounded),
                    label: Text(strings.retry),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _statusScaffold(
    BuildContext context,
    AppLocalizations strings,
    ProviderProfile profile,
  ) {
    final (title, body, icon) = switch (profile.profileStatus) {
      'PENDING_REVIEW' => (
          strings.providerPendingTitle,
          strings.providerPendingBody,
          Icons.hourglass_top_rounded,
        ),
      'ACTIVE' => (
          strings.providerApprovedTitle,
          strings.providerApprovedBody,
          Icons.verified_outlined,
        ),
      'SUSPENDED' => (
          strings.providerSuspendedTitle,
          strings.providerSuspendedBody,
          Icons.pause_circle_outline_rounded,
        ),
      _ => (
          strings.providerPendingTitle,
          strings.providerPendingBody,
          Icons.hourglass_top_rounded,
        ),
    };

    return Scaffold(
      appBar: _appBar(strings),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Icon(icon, size: 68, color: Theme.of(context).colorScheme.primary),
                  const SizedBox(height: 22),
                  Text(
                    title,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    body,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 22),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            profile.displayName,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '${profile.location['locality']}, ${profile.location['district']}',
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  OutlinedButton.icon(
                    onPressed: () => ref.read(authRepositoryProvider).signOut(),
                    icon: const Icon(Icons.logout_rounded),
                    label: Text(strings.signOut),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  AppBar _appBar(AppLocalizations strings) => AppBar(
        title: Text(strings.providerRegistrationTitle),
        actions: [
          const LanguageAction(),
          IconButton(
            tooltip: strings.signOut,
            onPressed: () => ref.read(authRepositoryProvider).signOut(),
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      );
}
