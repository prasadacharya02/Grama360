import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/widgets/language_action.dart';
import '../../l10n/generated/app_localizations.dart';
import '../admin/admin_models.dart';
import '../admin/admin_providers.dart';
import '../admin/admin_review_screen.dart';
import '../onboarding/role_selection_screen.dart';
import '../provider_registration/provider_registration_screen.dart';
import '../discovery/provider_directory_screen.dart';
import 'app_session.dart';
import 'auth_providers.dart';

class AuthenticatedStartScreen extends ConsumerWidget {
  const AuthenticatedStartScreen({required this.firebaseUid, super.key});

  final String firebaseUid;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppLocalizations.of(context);
    final adminAccess = ref.watch(adminAccessProvider(firebaseUid));

    return adminAccess.when(
      loading: () => _StatusScreen(message: strings.sessionChecking),
      error: (error, _) => error is AdminMfaRequiredException
          ? _AdminMfaRequiredScreen(
              reauthenticate: error.reauthenticate,
              enrollmentRequired: error.enrollmentRequired,
              firebaseUid: firebaseUid,
            )
          : _SessionErrorScreen(firebaseUid: firebaseUid, retryAdminAccess: true),
      data: (access) => access == null
          ? _AuthenticatedAppContent(firebaseUid: firebaseUid)
          : AdminReviewScreen(access: access),
    );
  }
}

class _AuthenticatedAppContent extends ConsumerWidget {
  const _AuthenticatedAppContent({required this.firebaseUid});

  final String firebaseUid;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppLocalizations.of(context);
    final session = ref.watch(appSessionProvider(firebaseUid));

    return session.when(
      loading: () => _StatusScreen(message: strings.sessionChecking),
      error: (_, __) => _SessionErrorScreen(firebaseUid: firebaseUid),
      data: (value) {
        final roles = value.roles.toSet();
        if (roles.isEmpty) return RoleSelectionScreen(firebaseUid: firebaseUid);
        if (roles.contains('CUSTOMER')) {
          return ProviderDirectoryScreen(firebaseUid: firebaseUid, session: value);
        }
        if (roles.contains('PROVIDER')) {
          return ProviderRegistrationScreen(
            firebaseUid: firebaseUid,
            primaryPhoneNumber: value.phoneNumber,
            initialName: value.fullName,
          );
        }
        return _RoleReadyScreen(firebaseUid: firebaseUid, session: value);
      },
    );
  }
}

class _AdminMfaRequiredScreen extends ConsumerWidget {
  const _AdminMfaRequiredScreen({
    required this.reauthenticate,
    required this.enrollmentRequired,
    required this.firebaseUid,
  });

  final bool reauthenticate;
  final bool enrollmentRequired;
  final String firebaseUid;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppLocalizations.of(context);
    return _StatusScreen(
      message: enrollmentRequired
          ? strings.adminMfaNotEnrolled
          : reauthenticate
              ? strings.adminMfaReauthRequired
              : strings.adminMfaRequired,
      action: FilledButton.icon(
        onPressed: () => ref.read(authRepositoryProvider).signOut(),
        icon: const Icon(Icons.logout_rounded),
        label: Text(strings.signOut),
      ),
      secondaryAction: TextButton(
        onPressed: () => ref.invalidate(adminAccessProvider(firebaseUid)),
        child: Text(strings.retry),
      ),
    );
  }
}

class _RoleReadyScreen extends ConsumerStatefulWidget {
  const _RoleReadyScreen({required this.firebaseUid, required this.session});

  final String firebaseUid;
  final AppSession session;

  @override
  ConsumerState<_RoleReadyScreen> createState() => _RoleReadyScreenState();
}

class _RoleReadyScreenState extends ConsumerState<_RoleReadyScreen> {
  bool _savingProviderRole = false;
  bool _hasRoleError = false;

  Future<void> _becomeProvider() async {
    setState(() {
      _savingProviderRole = true;
      _hasRoleError = false;
    });
    try {
      await ref.read(authRepositoryProvider).addRole('PROVIDER');
      if (mounted) ref.invalidate(appSessionProvider(widget.firebaseUid));
    } catch (_) {
      if (mounted) setState(() => _hasRoleError = true);
    } finally {
      if (mounted) setState(() => _savingProviderRole = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);
    final roles = widget.session.roles.toSet();

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
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(
                    Icons.verified_user_outlined,
                    size: 64,
                    color: Color(0xFF245B43),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    strings.roleReadyTitle,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    strings.roleReadyMessage,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 16),
                  if (roles.contains('CUSTOMER'))
                    _RoleInfoCard(
                      title: strings.customerRole,
                      description: strings.customerNextPhase,
                      icon: Icons.search_rounded,
                    ),
                  if (roles.contains('PROVIDER'))
                    _RoleInfoCard(
                      title: strings.providerRole,
                      description: strings.providerNextPhase,
                      icon: Icons.handyman_outlined,
                    ),
                  if (!roles.contains('PROVIDER')) ...[
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed: _savingProviderRole ? null : _becomeProvider,
                      icon: _savingProviderRole
                          ? const _SmallProgressIndicator()
                          : const Icon(Icons.handyman_outlined),
                      label: Text(strings.providerBecomeProvider),
                    ),
                    if (_hasRoleError)
                      Semantics(
                        liveRegion: true,
                        child: Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            strings.roleSaveError,
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Theme.of(context).colorScheme.error),
                          ),
                        ),
                      ),
                  ],
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: _savingProviderRole
                        ? null
                        : () => ref.read(authRepositoryProvider).signOut(),
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
}

class _SmallProgressIndicator extends StatelessWidget {
  const _SmallProgressIndicator();

  @override
  Widget build(BuildContext context) => const SizedBox.square(
        dimension: 20,
        child: CircularProgressIndicator(strokeWidth: 2),
      );
}

class _RoleInfoCard extends StatelessWidget {
  const _RoleInfoCard({
    required this.title,
    required this.description,
    required this.icon,
  });

  final String title;
  final String description;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 4),
                  Text(description),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SessionErrorScreen extends ConsumerWidget {
  const _SessionErrorScreen({
    required this.firebaseUid,
    this.retryAdminAccess = false,
  });

  final String firebaseUid;
  final bool retryAdminAccess;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppLocalizations.of(context);
    return _StatusScreen(
      message: strings.sessionError,
      action: FilledButton.icon(
        onPressed: () {
          if (retryAdminAccess) {
            ref.invalidate(adminAccessProvider(firebaseUid));
          } else {
            ref.invalidate(appSessionProvider(firebaseUid));
          }
        },
        icon: const Icon(Icons.refresh_rounded),
        label: Text(strings.retry),
      ),
      secondaryAction: TextButton(
        onPressed: () => ref.read(authRepositoryProvider).signOut(),
        child: Text(strings.signOut),
      ),
    );
  }
}

class _StatusScreen extends StatelessWidget {
  const _StatusScreen({required this.message, this.action, this.secondaryAction});

  final String message;
  final Widget? action;
  final Widget? secondaryAction;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
                  if (action == null)
                    const Center(child: CircularProgressIndicator())
                  else
                    const Icon(Icons.cloud_off_outlined, size: 56),
                  const SizedBox(height: 20),
                  Text(message, textAlign: TextAlign.center),
                  if (action != null) ...[
                    const SizedBox(height: 20),
                    action!,
                  ],
                  if (secondaryAction != null) secondaryAction!,
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
