import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../l10n/generated/app_localizations.dart';
import 'discovery_models.dart';
import 'discovery_providers.dart';

class ProviderReviewsSection extends ConsumerStatefulWidget {
  const ProviderReviewsSection({
    required this.providerId,
    required this.languageCode,
    super.key,
  });

  final String providerId;
  final String languageCode;

  @override
  ConsumerState<ProviderReviewsSection> createState() => _ProviderReviewsSectionState();
}

class _ProviderReviewsSectionState extends ConsumerState<ProviderReviewsSection> {
  static const int _pageSize = 20;

  final TextEditingController _textController = TextEditingController();
  final List<PublicProviderReview> _additionalReviews = [];
  bool _editing = false;
  bool _saving = false;
  bool _loadingMore = false;
  bool _paginationLoaded = false;
  bool _hasMore = false;
  String? _nextCursor;
  String? _editingReviewId;
  int _rating = 5;

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _openEditor(CustomerProviderReview? review) {
    setState(() {
      _editing = true;
      _editingReviewId = review?.id;
      _rating = review?.rating ?? 5;
      _textController.text = review?.reviewText ?? '';
    });
  }

  void _closeEditor() {
    if (_saving) return;
    setState(() {
      _editing = false;
      _editingReviewId = null;
      _textController.clear();
    });
  }

  Future<void> _saveReview() async {
    if (_saving) return;
    final strings = AppLocalizations.of(context);
    final isEditing = _editingReviewId != null;
    setState(() => _saving = true);
    try {
      final repository = ref.read(providerDirectoryRepositoryProvider);
      if (!isEditing) {
        await repository.createReview(
          providerId: widget.providerId,
          rating: _rating,
          reviewText: _textController.text,
        );
      } else {
        await repository.updateReview(
          reviewId: _editingReviewId!,
          rating: _rating,
          reviewText: _textController.text,
        );
      }
      if (!mounted) return;
      setState(() {
        _editing = false;
        _editingReviewId = null;
        _textController.clear();
        _additionalReviews.clear();
        _paginationLoaded = false;
        _nextCursor = null;
        _hasMore = false;
      });
      ref.invalidate(providerReviewsProvider(widget.providerId));
      ref.invalidate(publicProviderProfileProvider((
        providerId: widget.providerId,
        languageCode: widget.languageCode,
      )));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(isEditing ? strings.reviewUpdated : strings.reviewSaved),
        ),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(strings.reviewSaveError)),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _loadMore(ProviderReviewPage page) async {
    if (_loadingMore) return;
    final cursor = _paginationLoaded ? _nextCursor : page.nextCursor;
    if (cursor == null) return;
    setState(() => _loadingMore = true);
    try {
      final nextPage = await ref.read(providerDirectoryRepositoryProvider).loadReviews(
            providerId: widget.providerId,
            limit: _pageSize,
            cursor: cursor,
          );
      if (!mounted) return;
      setState(() {
        _paginationLoaded = true;
        _additionalReviews.addAll(nextPage.items);
        _nextCursor = nextPage.nextCursor;
        _hasMore = nextPage.hasMore;
      });
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context).reviewLoadError)),
      );
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);
    final reviews = ref.watch(providerReviewsProvider(widget.providerId));
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(strings.reviewHeading, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 10),
            reviews.when(
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.all(18),
                  child: CircularProgressIndicator(),
                ),
              ),
              error: (_, __) => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(strings.reviewLoadError),
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    onPressed: () => ref.invalidate(providerReviewsProvider(widget.providerId)),
                    icon: const Icon(Icons.refresh_rounded),
                    label: Text(strings.retry),
                  ),
                ],
              ),
              data: (page) => _buildReviews(strings, page),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReviews(AppLocalizations strings, ProviderReviewPage page) {
    final myReview = page.myReview;
    final publicReviews = [
      ...page.items.where((review) => !review.isMine),
      ..._additionalReviews.where((review) => !review.isMine),
    ];
    final hasMore = _paginationLoaded ? _hasMore : page.hasMore;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (myReview == null)
          OutlinedButton.icon(
            onPressed: _editing ? null : () => _openEditor(null),
            icon: const Icon(Icons.rate_review_outlined),
            label: Text(strings.reviewWriteButton),
          )
        else ...[
          Text(strings.reviewYourReview, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 5),
          _RatingStars(rating: myReview.rating, label: strings.reviewRatingValue(myReview.rating)),
          if (myReview.reviewText?.isNotEmpty == true) ...[
            const SizedBox(height: 6),
            Text(myReview.reviewText!),
          ],
          if (myReview.moderationStatus == 'VISIBLE')
            TextButton.icon(
              onPressed: _editing ? null : () => _openEditor(myReview),
              icon: const Icon(Icons.edit_outlined),
              label: Text(strings.reviewEditButton),
            )
          else
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(strings.reviewNotEditable),
            ),
        ],
        if (_editing) ...[
          const SizedBox(height: 8),
          _buildEditor(strings),
        ],
        if (myReview == null && publicReviews.isEmpty && !_editing) ...[
          const SizedBox(height: 8),
          Text(strings.reviewEmpty),
        ],
        if (publicReviews.isNotEmpty) ...[
          if (myReview != null || _editing) const Divider(height: 22),
          for (final review in publicReviews) ...[
            if (review != publicReviews.first) const Divider(height: 22),
            _PublicReviewTile(review: review),
          ],
        ],
        if (hasMore)
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: OutlinedButton.icon(
              onPressed: _loadingMore ? null : () => _loadMore(page),
              icon: _loadingMore
                  ? const SizedBox.square(
                      dimension: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.expand_more_rounded),
              label: Text(strings.loadMore),
            ),
          ),
      ],
    );
  }

  Widget _buildEditor(AppLocalizations strings) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          DropdownButtonFormField<int>(
            initialValue: _rating,
            decoration: InputDecoration(
              labelText: strings.reviewRatingLabel,
              prefixIcon: const Icon(Icons.star_rounded),
            ),
            items: [
              for (var rating = 1; rating <= 5; rating++)
                DropdownMenuItem(
                  value: rating,
                  child: Text(strings.reviewRatingValue(rating)),
                ),
            ],
            onChanged: _saving ? null : (value) => setState(() => _rating = value ?? 5),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _textController,
            enabled: !_saving,
            maxLength: 1500,
            maxLines: 4,
            textCapitalization: TextCapitalization.sentences,
            decoration: InputDecoration(
              labelText: strings.reviewTextLabel,
              hintText: strings.reviewTextHint,
              alignLabelWithHint: true,
              border: const OutlineInputBorder(),
            ),
          ),
          Row(
            children: [
              Expanded(
                child: TextButton(
                  onPressed: _saving ? null : _closeEditor,
                  child: Text(strings.adminCancel),
                ),
              ),
              Expanded(
                child: FilledButton.icon(
                  onPressed: _saving ? null : _saveReview,
                  icon: _saving
                      ? const SizedBox.square(
                          dimension: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.check_rounded),
                  label: Text(_saving
                      ? strings.reviewSaving
                      : _editingReviewId == null
                          ? strings.reviewSubmitButton
                          : strings.reviewSaveChanges),
                ),
              ),
            ],
          ),
        ],
      );
}

class _PublicReviewTile extends StatelessWidget {
  const _PublicReviewTile({required this.review});

  final PublicProviderReview review;

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                review.reviewerDisplayName,
                style: Theme.of(context).textTheme.titleSmall,
              ),
            ),
            _RatingStars(
              rating: review.rating,
              label: strings.reviewRatingValue(review.rating),
            ),
          ],
        ),
        if (review.reviewText?.isNotEmpty == true) ...[
          const SizedBox(height: 5),
          Text(review.reviewText!),
        ],
      ],
    );
  }
}

class _RatingStars extends StatelessWidget {
  const _RatingStars({required this.rating, required this.label});

  final int rating;
  final String label;

  @override
  Widget build(BuildContext context) => Semantics(
        label: label,
        child: ExcludeSemantics(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (var value = 1; value <= 5; value++)
                Icon(
                  value <= rating ? Icons.star_rounded : Icons.star_outline_rounded,
                  size: 18,
                  color: value <= rating ? const Color(0xFFB47B00) : Colors.grey,
                ),
            ],
          ),
        ),
      );
}
