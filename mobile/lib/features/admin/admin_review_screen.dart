import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/widgets/language_action.dart';
import '../../l10n/generated/app_localizations.dart';
import '../auth/auth_providers.dart';
import 'admin_models.dart';
import 'admin_providers.dart';
import 'admin_review_photo.dart';

class AdminReviewScreen extends ConsumerStatefulWidget {
  const AdminReviewScreen({required this.access, super.key});

  final AdminAccess access;

  @override
  ConsumerState<AdminReviewScreen> createState() => _AdminReviewScreenState();
}

class _AdminReviewScreenState extends ConsumerState<AdminReviewScreen> {
  static const _pageSize = 25;
  int _offset = 0;
  String? _busyProviderId;

  Future<void> _openReview(PendingProviderReview review) async {
    final decision = await showDialog<ProviderReviewDecision>(
      context: context,
      builder: (context) => _ProviderReviewDialog(
        review: review,
        canReview: widget.access.canReview,
      ),
    );
    if (decision == null || !mounted) return;

    setState(() => _busyProviderId = review.id);
    final strings = AppLocalizations.of(context);
    try {
      await ref.read(adminRepositoryProvider).decideProviderReview(
            providerId: review.id,
            decision: decision.decision,
            note: decision.note,
          );
      if (!mounted) return;
      setState(() => _offset = 0);
      ref.invalidate(pendingProviderReviewsPageProvider);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            decision.decision == 'APPROVE'
                ? strings.adminDecisionApproved
                : strings.adminDecisionRejected,
          ),
        ),
      );
    } on AdminMfaRequiredException catch (exception) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            exception.enrollmentRequired
                ? strings.adminMfaNotEnrolled
                : exception.reauthenticate
                    ? strings.adminMfaReauthRequired
                    : strings.adminMfaRequired,
          ),
        ),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(strings.adminDecisionError)),
      );
    } finally {
      if (mounted) setState(() => _busyProviderId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);
    final localeCode = Localizations.localeOf(context).languageCode;
    final queue = ref.watch(pendingProviderReviewsPageProvider(_offset));

    return Scaffold(
      appBar: AppBar(
        title: Text(strings.adminProviderReviewsTitle),
        actions: [
          IconButton(
            tooltip: strings.retry,
            onPressed: () => ref.invalidate(pendingProviderReviewsPageProvider),
            icon: const Icon(Icons.refresh_rounded),
          ),
          const LanguageAction(),
          IconButton(
            tooltip: strings.signOut,
            onPressed: () => ref.read(authRepositoryProvider).signOut(),
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 760),
            child: queue.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => _QueueProblem(
                message: error is AdminMfaRequiredException
                    ? (error.enrollmentRequired
                        ? strings.adminMfaNotEnrolled
                        : error.reauthenticate
                            ? strings.adminMfaReauthRequired
                            : strings.adminMfaRequired)
                    : strings.adminQueueLoadError,
                onRetry: () => ref.invalidate(pendingProviderReviewsPageProvider),
              ),
              data: (page) => _buildQueue(context, strings, localeCode, page),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQueue(
    BuildContext context,
    AppLocalizations strings,
    String localeCode,
    AdminReviewQueue page,
  ) {
    if (page.total == 0) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.task_alt_rounded, size: 64),
              const SizedBox(height: 16),
              Text(strings.adminNoPendingReviews, textAlign: TextAlign.center),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
        if (!widget.access.canReview)
          Card(
            margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: ListTile(
              leading: const Icon(Icons.visibility_outlined),
              title: Text(strings.adminReadOnly),
            ),
          ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async {
              await ref.refresh(pendingProviderReviewsPageProvider(_offset).future);
            },
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
              itemCount: page.items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final review = page.items[index];
                final busy = _busyProviderId == review.id;
                final services = review.services
                    .map((service) => service.nameFor(localeCode))
                    .join(', ');
                return Card(
                  clipBehavior: Clip.antiAlias,
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                    leading: CircleAvatar(
                      child: busy
                          ? const SizedBox.square(
                              dimension: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.person_outline_rounded),
                    ),
                    title: Text(review.displayName),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 5),
                      child: Text([
                        if (review.businessName != null && review.businessName!.isNotEmpty)
                          review.businessName!,
                        if (services.isNotEmpty) services,
                        '${review.locality}, ${review.district}',
                        review.primaryPhoneNumber,
                      ].join(' • ')),
                    ),
                    trailing: const Icon(Icons.chevron_right_rounded),
                    onTap: _busyProviderId == null ? () => _openReview(review) : null,
                  ),
                );
              },
            ),
          ),
        ),
        _PageControls(
          offset: _offset,
          limit: page.limit,
          total: page.total,
          onPrevious: _offset == 0
              ? null
              : () => setState(
                  () => _offset = (_offset - _pageSize).clamp(0, page.total).toInt(),
                ),
          onNext: _offset + page.items.length >= page.total
              ? null
              : () => setState(() => _offset += _pageSize),
        ),
      ],
    );
  }
}

class _PageControls extends StatelessWidget {
  const _PageControls({
    required this.offset,
    required this.limit,
    required this.total,
    required this.onPrevious,
    required this.onNext,
  });

  final int offset;
  final int limit;
  final int total;
  final VoidCallback? onPrevious;
  final VoidCallback? onNext;

  @override
  Widget build(BuildContext context) {
    final start = offset + 1;
    final end = (offset + limit).clamp(0, total);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            onPressed: onPrevious,
            tooltip: MaterialLocalizations.of(context).previousPageTooltip,
            icon: const Icon(Icons.chevron_left_rounded),
          ),
          Text('$start–$end / $total'),
          IconButton(
            onPressed: onNext,
            tooltip: MaterialLocalizations.of(context).nextPageTooltip,
            icon: const Icon(Icons.chevron_right_rounded),
          ),
        ],
      ),
    );
  }
}

class _QueueProblem extends StatelessWidget {
  const _QueueProblem({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.cloud_off_outlined, size: 56),
            const SizedBox(height: 16),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: Text(strings.retry),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProviderReviewDialog extends StatefulWidget {
  const _ProviderReviewDialog({required this.review, required this.canReview});

  final PendingProviderReview review;
  final bool canReview;

  @override
  State<_ProviderReviewDialog> createState() => _ProviderReviewDialogState();
}

class _ProviderReviewDialogState extends State<_ProviderReviewDialog> {
  final _noteController = TextEditingController();
  bool _rejecting = false;
  bool _noteError = false;

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  void _submitRejection() {
    final note = _noteController.text.trim();
    if (note.isEmpty) {
      setState(() => _noteError = true);
      return;
    }
    Navigator.of(context).pop(ProviderReviewDecision(decision: 'REJECT', note: note));
  }

  String _workingHoursText(
    AppLocalizations strings,
    bool isClosed,
    String? opensAt,
    String? closesAt,
  ) {
    if (isClosed) return strings.providerClosedDay;
    return '${opensAt ?? '--'}–${closesAt ?? '--'}';
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);
    final localeCode = Localizations.localeOf(context).languageCode;
    final review = widget.review;
    final days = <String>[
      strings.sunday,
      strings.monday,
      strings.tuesday,
      strings.wednesday,
      strings.thursday,
      strings.friday,
      strings.saturday,
    ];
    final languages = review.languages.map((code) => switch (code) {
          'kn' => strings.providerLanguageKannada,
          'en' => strings.providerLanguageEnglish,
          'tcy' => strings.providerLanguageTulu,
          _ => code,
        }).join(', ');

    return AlertDialog(
      title: Text(review.displayName),
      content: SizedBox(
        width: 560,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (review.profilePhotoPath != null && review.profilePhotoPath!.isNotEmpty) ...[
                Center(child: AdminReviewPhoto(path: review.profilePhotoPath!)),
                const SizedBox(height: 12),
              ],
              if (review.businessName != null && review.businessName!.isNotEmpty)
                _ReviewDetailLine(label: strings.adminBusinessName, value: review.businessName!),
              _ReviewDetailLine(label: strings.adminPhone, value: review.primaryPhoneNumber),
              if (review.secondaryPhoneNumber != null)
                _ReviewDetailLine(
                  label: strings.adminSecondaryPhone,
                  value: review.secondaryPhoneNumber!,
                ),
              _ReviewDetailLine(
                label: strings.adminLocation,
                value: [review.locality, if (review.taluk != null) review.taluk!, review.district]
                    .join(', '),
              ),
              _ReviewDetailLine(
                label: strings.adminExperience,
                value: '${review.experienceYears} ${strings.adminYears}',
              ),
              _ReviewDetailLine(
                label: strings.adminRadius,
                value: '${review.serviceRadiusKm.toStringAsFixed(0)} ${strings.kilometresUnit}',
              ),
              _ReviewDetailLine(label: strings.adminLanguages, value: languages),
              _ReviewDetailLine(
                label: strings.adminServices,
                value: review.services
                    .map((service) => service.nameFor(localeCode))
                    .join(', '),
              ),
              _ReviewDetailLine(
                label: strings.adminSubmittedAt,
                value: MaterialLocalizations.of(context)
                    .formatMediumDate(review.submittedAt.toLocal()),
              ),
              if (review.description != null && review.description!.isNotEmpty)
                _ReviewDetailLine(
                  label: strings.providerDescriptionLabel,
                  value: review.description!,
                ),
              const SizedBox(height: 8),
              Text(strings.adminHours, style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 4),
              for (final hour in review.workingHours)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Text(
                    '${days[hour.weekday]}: ${_workingHoursText(strings, hour.isClosed, hour.opensAt, hour.closesAt)}',
                  ),
                ),
              if (_rejecting) ...[
                const SizedBox(height: 16),
                TextField(
                  controller: _noteController,
                  autofocus: true,
                  minLines: 2,
                  maxLines: 4,
                  maxLength: 1000,
                  onChanged: (_) {
                    if (_noteError) setState(() => _noteError = false);
                  },
                  decoration: InputDecoration(
                    labelText: strings.adminRejectNoteLabel,
                    hintText: strings.adminRejectNoteHint,
                    errorText: _noteError ? strings.adminRejectNoteRequired : null,
                    border: const OutlineInputBorder(),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(strings.adminCancel),
        ),
        if (widget.canReview && !_rejecting)
          OutlinedButton(
            onPressed: () => setState(() => _rejecting = true),
            child: Text(strings.adminReject),
          ),
        if (widget.canReview && !_rejecting)
          FilledButton.icon(
            onPressed: () => Navigator.of(context).pop(
              const ProviderReviewDecision(decision: 'APPROVE'),
            ),
            icon: const Icon(Icons.check_circle_outline_rounded),
            label: Text(strings.adminApprove),
          ),
        if (widget.canReview && _rejecting)
          FilledButton.icon(
            onPressed: _submitRejection,
            icon: const Icon(Icons.send_rounded),
            label: Text(strings.adminSubmitRejection),
          ),
      ],
    );
  }
}

class _ReviewDetailLine extends StatelessWidget {
  const _ReviewDetailLine({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: RichText(
        text: TextSpan(
          style: DefaultTextStyle.of(context).style,
          children: [
            TextSpan(
              text: '$label: ',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            TextSpan(text: value),
          ],
        ),
      ),
    );
  }
}
