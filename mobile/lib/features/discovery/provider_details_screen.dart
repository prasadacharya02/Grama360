import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../l10n/generated/app_localizations.dart';
import 'discovery_models.dart';
import 'discovery_providers.dart';
import 'provider_reviews_section.dart';

class ProviderDetailsScreen extends ConsumerStatefulWidget {
  const ProviderDetailsScreen({
    required this.providerId,
    required this.languageCode,
    super.key,
  });

  final String providerId;
  final String languageCode;

  @override
  ConsumerState<ProviderDetailsScreen> createState() =>
      _ProviderDetailsScreenState();
}

class _ProviderDetailsScreenState extends ConsumerState<ProviderDetailsScreen> {
  bool _requestingCall = false;

  Future<void> _callProvider() async {
    setState(() => _requestingCall = true);
    try {
      final phoneNumber = await ref
          .read(providerDirectoryRepositoryProvider)
          .requestCallIntent(widget.providerId);
      final opened = await launchUrl(
        Uri(scheme: 'tel', path: phoneNumber),
        mode: LaunchMode.externalApplication,
      );
      if (!opened) throw StateError('The phone dialer could not be opened.');
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context).discoveryCallError)),
      );
    } finally {
      if (mounted) setState(() => _requestingCall = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);
    final profile = ref.watch(
      publicProviderProfileProvider((
        providerId: widget.providerId,
        languageCode: widget.languageCode,
      )),
    );
    final loadedProfile = profile.asData?.value;

    return Scaffold(
      appBar: AppBar(title: Text(strings.discoveryTitle)),
      body: SafeArea(
        child: profile.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => _MessageState(
            message: strings.discoveryProviderProfileError,
            actionLabel: strings.retry,
            onAction: () => ref.invalidate(
              publicProviderProfileProvider((
                providerId: widget.providerId,
                languageCode: widget.languageCode,
              )),
            ),
          ),
          data: (value) => _ProviderProfileBody(
            profile: value,
            languageCode: widget.languageCode,
          ),
        ),
      ),
      bottomNavigationBar: loadedProfile == null
          ? null
          : SafeArea(
              minimum: const EdgeInsets.fromLTRB(16, 10, 16, 12),
              child: FilledButton.icon(
                onPressed: _requestingCall ? null : _callProvider,
                icon: _requestingCall
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.call_rounded),
                label: Text(strings.discoveryCallButton),
              ),
            ),
    );
  }
}

class _ProviderProfileBody extends StatelessWidget {
  const _ProviderProfileBody({
    required this.profile,
    required this.languageCode,
  });

  final PublicProviderProfile profile;
  final String languageCode;

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);
    final title = profile.businessName?.trim().isNotEmpty == true
        ? profile.businessName!.trim()
        : profile.displayName;
    final locality = [
      profile.location['locality'],
      profile.location['district'],
      profile.location['state'],
    ].where((value) => value != null && value.isNotEmpty).join(', ');
    final serviceNames = profile.services.map((service) => service.name).join(' · ');
    final statusLabel = _availabilityLabel(strings, profile.availability);
    final statusColor = switch (profile.availability) {
      'AVAILABLE' => const Color(0xFF245B43),
      'BUSY' => const Color(0xFF805600),
      _ => Colors.grey.shade700,
    };
    final dayNames = [
      strings.sunday,
      strings.monday,
      strings.tuesday,
      strings.wednesday,
      strings.thursday,
      strings.friday,
      strings.saturday,
    ];

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 24),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 30,
                      backgroundColor: Theme.of(context).colorScheme.secondaryContainer,
                      child: const Icon(Icons.handyman_outlined, size: 30),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
                          if (profile.businessName?.trim().isNotEmpty == true)
                            Text(profile.displayName),
                          const SizedBox(height: 8),
                          _StatusLabel(label: statusLabel, color: statusColor),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                _DetailLine(
                  icon: Icons.location_on_outlined,
                  text: locality,
                ),
                const SizedBox(height: 10),
                _DetailLine(
                  icon: Icons.work_history_outlined,
                  text: strings.discoveryExperience(profile.experienceYears),
                ),
                const SizedBox(height: 10),
                _DetailLine(
                  icon: Icons.directions_outlined,
                  text: strings.discoveryServiceRadius(
                    profile.serviceRadiusKm.toStringAsFixed(
                      profile.serviceRadiusKm == profile.serviceRadiusKm.roundToDouble()
                          ? 0
                          : 1,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                _DetailLine(
                  icon: Icons.star_outline_rounded,
                  text: profile.averageRating == null
                      ? strings.discoveryNoReviews
                      : strings.discoveryRatingSummary(
                          profile.averageRating!.toStringAsFixed(1),
                          profile.reviewCount,
                        ),
                ),
                if (profile.description?.trim().isNotEmpty == true) ...[
                  const SizedBox(height: 20),
                  Text(
                    profile.description!.trim(),
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        _InfoCard(
          title: strings.discoveryServicesHeading,
          icon: Icons.home_repair_service_outlined,
          child: Text(serviceNames),
        ),
        const SizedBox(height: 12),
        _InfoCard(
          title: strings.discoveryLocationHeading,
          icon: Icons.place_outlined,
          child: Text(locality),
        ),
        const SizedBox(height: 12),
        _InfoCard(
          title: strings.discoveryHoursHeading,
          icon: Icons.schedule_rounded,
          child: Column(
            children: [
              for (final hour in profile.workingHours)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 5),
                  child: Row(
                    children: [
                      Expanded(child: Text(dayNames[hour.weekday])),
                      Text(
                        hour.isClosed
                            ? strings.discoveryClosed
                            : '${hour.opensAt ?? ''} – ${hour.closesAt ?? ''}',
                        textAlign: TextAlign.end,
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        ProviderReviewsSection(
          providerId: profile.id,
          languageCode: languageCode,
        ),
      ],
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.title, required this.icon, required this.child});

  final String title;
  final IconData icon;
  final Widget child;

  @override
  Widget build(BuildContext context) => Card(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(icon),
                  const SizedBox(width: 8),
                  Text(title, style: Theme.of(context).textTheme.titleMedium),
                ],
              ),
              const SizedBox(height: 10),
              child,
            ],
          ),
        ),
      );
}

class _DetailLine extends StatelessWidget {
  const _DetailLine({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20),
          const SizedBox(width: 10),
          Expanded(child: Text(text)),
        ],
      );
}

class _StatusLabel extends StatelessWidget {
  const _StatusLabel({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(100),
        ),
        child: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w600)),
      );
}

class _MessageState extends StatelessWidget {
  const _MessageState({required this.message, required this.actionLabel, required this.onAction});

  final String message;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(message, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: onAction,
                icon: const Icon(Icons.refresh_rounded),
                label: Text(actionLabel),
              ),
            ],
          ),
        ),
      );
}

String _availabilityLabel(AppLocalizations strings, String availability) =>
    switch (availability) {
      'AVAILABLE' => strings.discoveryAvailableStatus,
      'BUSY' => strings.discoveryBusyStatus,
      _ => strings.discoveryOfflineStatus,
    };
