import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/widgets/language_action.dart';
import '../../l10n/generated/app_localizations.dart';
import 'discovery_models.dart';
import 'discovery_providers.dart';
import 'provider_details_screen.dart';

class FavoritesScreen extends ConsumerStatefulWidget {
  const FavoritesScreen({super.key});

  @override
  ConsumerState<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends ConsumerState<FavoritesScreen> {
  static const int _pageSize = 20;

  List<PublicProviderSummary> _items = const [];
  final Set<String> _removing = {};
  bool _hasMore = false;
  bool _loading = true;
  bool _loadingMore = false;
  bool _failed = false;
  int _nextOffset = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _loadFavorites();
    });
  }

  String _languageCode() =>
      Localizations.localeOf(context).languageCode == 'kn' ? 'kn' : 'en';

  Future<void> _loadFavorites({bool append = false}) async {
    if (_loadingMore || (_loading && append)) return;
    setState(() {
      if (append) {
        _loadingMore = true;
      } else {
        _loading = true;
        _failed = false;
      }
    });

    try {
      final page = await ref
          .read(providerDirectoryRepositoryProvider)
          .loadFavorites(
            languageCode: _languageCode(),
            limit: _pageSize,
            offset: append ? _nextOffset : 0,
          );
      if (!mounted) return;
      setState(() {
        _items = append ? [..._items, ...page.items] : page.items;
        _nextOffset = append ? _nextOffset + page.items.length : page.items.length;
        _hasMore = page.hasMore;
      });
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
          _loadingMore = false;
        });
      }
    }
  }

  Future<void> _removeFavorite(PublicProviderSummary provider) async {
    if (_removing.contains(provider.id)) return;
    setState(() => _removing.add(provider.id));
    final strings = AppLocalizations.of(context);
    try {
      await ref.read(providerDirectoryRepositoryProvider).setFavorite(
            providerId: provider.id,
            favorite: false,
          );
      if (!mounted) return;
      setState(() =>
          _items = _items.where((item) => item.id != provider.id).toList(growable: false));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(strings.favoritesRemoved)),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(strings.favoritesUpdateError)),
      );
    } finally {
      if (mounted) setState(() => _removing.remove(provider.id));
    }
  }

  void _openProfile(PublicProviderSummary provider) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ProviderDetailsScreen(
          providerId: provider.id,
          languageCode: _languageCode(),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(strings.favoritesTitle),
        actions: const [LanguageAction()],
      ),
      body: SafeArea(child: _buildBody(strings)),
    );
  }

  Widget _buildBody(AppLocalizations strings) {
    if (_loading && _items.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_failed && _items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(strings.favoritesLoadError, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: _loadFavorites,
                icon: const Icon(Icons.refresh_rounded),
                label: Text(strings.retry),
              ),
            ],
          ),
        ),
      );
    }
    if (_items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.favorite_border_rounded, size: 52),
              const SizedBox(height: 12),
              Text(strings.favoritesEmpty, textAlign: TextAlign.center),
            ],
          ),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 20),
      children: [
        for (final provider in _items)
          Card(
            margin: const EdgeInsets.symmetric(vertical: 5),
            child: ListTile(
              onTap: () => _openProfile(provider),
              leading: CircleAvatar(
                backgroundColor: Theme.of(context).colorScheme.secondaryContainer,
                child: const Icon(Icons.handyman_outlined),
              ),
              title: Text(
                provider.businessName?.trim().isNotEmpty == true
                    ? provider.businessName!.trim()
                    : provider.displayName,
              ),
              subtitle: Text(
                '${provider.location['locality']}, ${provider.location['district']} · '
                '${_availabilityLabel(strings, provider.availability)}',
              ),
              trailing: IconButton(
                tooltip: strings.favoritesRemove,
                onPressed: _removing.contains(provider.id)
                    ? null
                    : () => unawaited(_removeFavorite(provider)),
                icon: _removing.contains(provider.id)
                    ? const SizedBox.square(
                        dimension: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.favorite_rounded),
              ),
            ),
          ),
        if (_failed)
          Padding(
            padding: const EdgeInsets.all(12),
            child: Text(
              strings.favoritesLoadError,
              textAlign: TextAlign.center,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ),
        if (_hasMore)
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 8, 4, 0),
            child: OutlinedButton.icon(
              onPressed: _loadingMore ? null : () => _loadFavorites(append: true),
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

String _availabilityLabel(AppLocalizations strings, String availability) =>
    switch (availability) {
      'AVAILABLE' => strings.discoveryAvailableStatus,
      'BUSY' => strings.discoveryBusyStatus,
      _ => strings.discoveryOfflineStatus,
    };
