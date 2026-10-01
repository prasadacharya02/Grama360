import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/widgets/language_action.dart';
import '../../l10n/generated/app_localizations.dart';
import '../auth/app_session.dart';
import '../auth/auth_providers.dart';
import '../provider_registration/provider_registration_screen.dart';
import 'discovery_models.dart';
import 'discovery_providers.dart';
import 'provider_details_screen.dart';

class ProviderDirectoryScreen extends ConsumerStatefulWidget {
  const ProviderDirectoryScreen({
    required this.firebaseUid,
    required this.session,
    super.key,
  });

  final String firebaseUid;
  final AppSession session;

  @override
  ConsumerState<ProviderDirectoryScreen> createState() =>
      _ProviderDirectoryScreenState();
}

class _ProviderDirectoryScreenState extends ConsumerState<ProviderDirectoryScreen> {
  final TextEditingController _queryController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  String? _selectedCategoryId;
  late ProviderSearchRequest _request;
  List<PublicProviderSummary> _items = const [];
  bool _hasMore = false;
  bool _loadingResults = true;
  bool _loadingMore = false;
  bool _addingProviderRole = false;
  bool _searchFailed = false;

  @override
  void initState() {
    super.initState();
    _request = ProviderSearchRequest(
      languageCode: _supportedLanguage(widget.session.preferredLanguage),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _runSearch();
    });
  }

  @override
  void dispose() {
    _queryController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _runSearch() async {
    final languageCode = _currentLanguageCode();
    final request = ProviderSearchRequest(
      languageCode: languageCode,
      categoryId: _selectedCategoryId,
      query: _queryController.text.trim(),
      location: _locationController.text.trim(),
    );
    setState(() {
      _request = request;
      _items = const [];
      _hasMore = false;
      _loadingResults = true;
      _loadingMore = false;
      _searchFailed = false;
    });

    try {
      final page = await ref.read(providerDirectoryRepositoryProvider).search(request);
      if (!mounted) return;
      setState(() {
        _items = page.items;
        _hasMore = page.hasMore;
      });
    } catch (_) {
      if (mounted) setState(() => _searchFailed = true);
    } finally {
      if (mounted) setState(() => _loadingResults = false);
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || !_hasMore) return;
    setState(() {
      _loadingMore = true;
      _searchFailed = false;
    });
    try {
      final page = await ref
          .read(providerDirectoryRepositoryProvider)
          .search(_request.withOffset(_items.length));
      if (!mounted) return;
      setState(() {
        _items = [..._items, ...page.items];
        _hasMore = page.hasMore;
      });
    } catch (_) {
      if (mounted) setState(() => _searchFailed = true);
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  String _currentLanguageCode() =>
      _supportedLanguage(Localizations.localeOf(context).languageCode);

  String _supportedLanguage(String languageCode) =>
      languageCode == 'kn' ? 'kn' : 'en';

  void _openProfile(PublicProviderSummary provider) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ProviderDetailsScreen(
          providerId: provider.id,
          languageCode: _currentLanguageCode(),
        ),
      ),
    );
  }

  void _openProviderTools() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ProviderRegistrationScreen(
          firebaseUid: widget.firebaseUid,
          primaryPhoneNumber: widget.session.phoneNumber,
          initialName: widget.session.fullName,
        ),
      ),
    );
  }

  Future<void> _becomeProvider() async {
    setState(() => _addingProviderRole = true);
    try {
      await ref.read(authRepositoryProvider).addRole('PROVIDER');
      if (mounted) ref.invalidate(appSessionProvider(widget.firebaseUid));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context).roleSaveError)),
      );
    } finally {
      if (mounted) setState(() => _addingProviderRole = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);
    final languageCode = _currentLanguageCode();

    return Scaffold(
      appBar: AppBar(
        title: Text(strings.discoveryTitle),
        actions: [
          if (widget.session.roles.contains('PROVIDER'))
            IconButton(
              tooltip: strings.discoveryProviderModeTooltip,
              onPressed: _openProviderTools,
              icon: const Icon(Icons.handyman_outlined),
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
        child: Column(
          children: [
            Flexible(
              fit: FlexFit.loose,
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.sizeOf(context).height * 0.52,
                ),
                child: SingleChildScrollView(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          strings.discoveryIntro,
                          style: Theme.of(context).textTheme.bodyLarge,
                        ),
                        if (!widget.session.roles.contains('PROVIDER'))
                          Align(
                            alignment: Alignment.centerLeft,
                            child: TextButton.icon(
                              onPressed: _addingProviderRole ? null : _becomeProvider,
                              icon: _addingProviderRole
                                  ? const SizedBox.square(
                                      dimension: 16,
                                      child: CircularProgressIndicator(strokeWidth: 2),
                                    )
                                  : const Icon(Icons.handyman_outlined),
                              label: Text(strings.providerBecomeProvider),
                            ),
                          ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _queryController,
                          textInputAction: TextInputAction.search,
                          onSubmitted: (_) => _runSearch(),
                          decoration: InputDecoration(
                            labelText: strings.discoveryQueryLabel,
                            hintText: strings.discoveryQueryHint,
                            prefixIcon: const Icon(Icons.search_rounded),
                          ),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _locationController,
                          textInputAction: TextInputAction.search,
                          onSubmitted: (_) => _runSearch(),
                          decoration: InputDecoration(
                            labelText: strings.discoveryLocationLabel,
                            hintText: strings.discoveryLocationHint,
                            prefixIcon: const Icon(Icons.location_on_outlined),
                          ),
                        ),
                        const SizedBox(height: 10),
                        _buildCategorySelector(strings, languageCode),
                        const SizedBox(height: 10),
                        FilledButton.icon(
                          onPressed: _loadingResults ? null : _runSearch,
                          icon: _loadingResults
                              ? const SizedBox.square(
                                  dimension: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.search_rounded),
                          label: Text(strings.discoverySearchButton),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _runSearch,
                child: _buildResults(strings),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategorySelector(AppLocalizations strings, String languageCode) {
    final categories = ref.watch(discoveryCategoriesProvider(languageCode));
    return categories.when(
      loading: () => InputDecorator(
        decoration: InputDecoration(labelText: strings.discoveryCategoryLabel),
        child: const LinearProgressIndicator(),
      ),
      error: (_, __) => Text(
        strings.providerCategoriesLoadError,
        style: TextStyle(color: Theme.of(context).colorScheme.error),
      ),
      data: (values) => DropdownButtonFormField<String?>(
        initialValue: _selectedCategoryId,
        isExpanded: true,
        decoration: InputDecoration(
          labelText: strings.discoveryCategoryLabel,
          prefixIcon: const Icon(Icons.home_repair_service_outlined),
        ),
        items: [
          DropdownMenuItem<String?>(
            value: null,
            child: Text(strings.discoveryAllServices),
          ),
          for (final category in values)
            DropdownMenuItem<String?>(
              value: category.id,
              child: Text(category.name),
            ),
        ],
        onChanged: (value) => setState(() => _selectedCategoryId = value),
      ),
    );
  }

  Widget _buildResults(AppLocalizations strings) {
    if (_loadingResults && _items.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const SizedBox(height: 40),
          const Center(child: CircularProgressIndicator()),
          const SizedBox(height: 12),
          Center(child: Text(strings.discoverySearching)),
        ],
      );
    }
    if (_searchFailed && _items.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const SizedBox(height: 32),
          Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  const Icon(Icons.wifi_off_rounded, size: 42),
                  const SizedBox(height: 12),
                  Text(strings.discoverySearchError, textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: _runSearch,
                    icon: const Icon(Icons.refresh_rounded),
                    label: Text(strings.retry),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    }
    if (!_loadingResults && _items.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const SizedBox(height: 32),
          Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  const Icon(Icons.search_off_rounded, size: 48),
                  const SizedBox(height: 12),
                  Text(strings.discoveryNoResults, textAlign: TextAlign.center),
                ],
              ),
            ),
          ),
        ],
      );
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(12, 4, 12, 20),
      children: [
        for (final provider in _items)
          _ProviderResultCard(
            provider: provider,
            onTap: () => _openProfile(provider),
          ),
        if (_searchFailed)
          Padding(
            padding: const EdgeInsets.all(12),
            child: Text(
              strings.discoverySearchError,
              textAlign: TextAlign.center,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ),
        if (_hasMore)
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 8, 4, 0),
            child: OutlinedButton.icon(
              onPressed: _loadingMore ? null : _loadMore,
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
}

class _ProviderResultCard extends StatelessWidget {
  const _ProviderResultCard({required this.provider, required this.onTap});

  final PublicProviderSummary provider;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);
    final title = provider.businessName?.trim().isNotEmpty == true
        ? provider.businessName!.trim()
        : provider.displayName;
    final serviceNames = provider.services.map((service) => service.name).join(' · ');
    final locality = [
      provider.location['locality'],
      provider.location['district'],
    ].where((value) => value != null && value.isNotEmpty).join(', ');
    final status = _availabilityLabel(strings, provider.availability);
    final statusColor = switch (provider.availability) {
      'AVAILABLE' => const Color(0xFF245B43),
      'BUSY' => const Color(0xFF805600),
      _ => Colors.grey.shade700,
    };

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 5),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 25,
                backgroundColor: Theme.of(context).colorScheme.secondaryContainer,
                child: const Icon(Icons.handyman_outlined),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    if (provider.businessName?.trim().isNotEmpty == true)
                      Text(provider.displayName),
                    const SizedBox(height: 4),
                    Text(locality),
                    if (serviceNames.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(serviceNames, maxLines: 2, overflow: TextOverflow.ellipsis),
                    ],
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        _StatusLabel(label: status, color: statusColor),
                        if (provider.averageRating case final rating?)
                          Text(
                            strings.discoveryRatingSummary(
                              rating.toStringAsFixed(1),
                              provider.reviewCount,
                            ),
                            style: Theme.of(context).textTheme.bodySmall,
                          )
                        else
                          Text(
                            strings.discoveryNoReviews,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusLabel extends StatelessWidget {
  const _StatusLabel({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(100),
        ),
        child: Text(
          label,
          style: TextStyle(color: color, fontWeight: FontWeight.w600),
        ),
      );
}

String _availabilityLabel(AppLocalizations strings, String availability) =>
    switch (availability) {
      'AVAILABLE' => strings.discoveryAvailableStatus,
      'BUSY' => strings.discoveryBusyStatus,
      _ => strings.discoveryOfflineStatus,
    };
