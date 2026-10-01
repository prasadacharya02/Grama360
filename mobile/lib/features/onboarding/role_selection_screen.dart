import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/widgets/language_action.dart';
import '../../l10n/generated/app_localizations.dart';
import '../auth/auth_providers.dart';

class RoleSelectionScreen extends ConsumerStatefulWidget {
  const RoleSelectionScreen({required this.firebaseUid, super.key});

  final String firebaseUid;

  @override
  ConsumerState<RoleSelectionScreen> createState() => _RoleSelectionScreenState();
}

class _RoleSelectionScreenState extends ConsumerState<RoleSelectionScreen> {
  String? _savingRole;
  bool _hasError = false;

  Future<void> _chooseRole(String role) async {
    setState(() {
      _savingRole = role;
      _hasError = false;
    });

    try {
      await ref.read(authRepositoryProvider).addRole(role);
      ref.invalidate(appSessionProvider(widget.firebaseUid));
    } catch (_) {
      if (mounted) setState(() => _hasError = true);
    } finally {
      if (mounted) setState(() => _savingRole = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);
    final isSaving = _savingRole != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(strings.appTitle),
        actions: const [LanguageAction()],
      ),
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
                    Icons.people_alt_rounded,
                    size: 64,
                    color: Color(0xFF245B43),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    strings.roleSelectionTitle,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 28),
                  FilledButton.icon(
                    onPressed: isSaving ? null : () => _chooseRole('CUSTOMER'),
                    icon: _savingRole == 'CUSTOMER'
                        ? const _SmallProgressIndicator()
                        : const Icon(Icons.search_rounded),
                    label: Text(strings.customerRole),
                  ),
                  const SizedBox(height: 14),
                  OutlinedButton.icon(
                    onPressed: isSaving ? null : () => _chooseRole('PROVIDER'),
                    icon: _savingRole == 'PROVIDER'
                        ? const _SmallProgressIndicator()
                        : const Icon(Icons.handyman_outlined),
                    label: Text(strings.providerRole),
                  ),
                  if (_hasError) ...[
                    const SizedBox(height: 16),
                    Semantics(
                      liveRegion: true,
                      child: Text(
                        strings.roleSaveError,
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Theme.of(context).colorScheme.error),
                      ),
                    ),
                  ],
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
