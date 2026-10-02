import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:grama360/features/discovery/discovery_providers.dart';
import 'package:grama360/features/discovery/discovery_repository.dart';
import 'package:grama360/features/discovery/provider_reviews_section.dart';
import 'package:grama360/l10n/generated/app_localizations.dart';

class _ReviewAdapter implements HttpClientAdapter {
  int _reviewListCalls = 0;
  RequestOptions? createRequest;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    Object body;
    if (options.method == 'POST') {
      createRequest = options;
      body = {'review': _savedReview};
    } else {
      _reviewListCalls++;
      body = _reviewListCalls == 1
          ? {
              'items': [],
              'hasMore': false,
              'nextCursor': null,
              'myReview': null,
            }
          : {
              'items': [
                {
                  'id': '44444444-4444-4444-8444-444444444444',
                  'rating': 5,
                  'reviewText': 'Helpful service.',
                  'reviewerDisplayName': 'Lakshmi',
                  'createdAt': '2026-10-01T10:00:00.000Z',
                  'isMine': true,
                },
              ],
              'hasMore': false,
              'nextCursor': null,
              'myReview': _savedReview,
            };
    }
    return ResponseBody.fromString(
      jsonEncode(body),
      options.method == 'POST' ? 201 : 200,
      headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
    );
  }

  @override
  void close({bool force = false}) {}
}

const _savedReview = {
  'id': '44444444-4444-4444-8444-444444444444',
  'rating': 5,
  'reviewText': 'Helpful service.',
  'moderationStatus': 'VISIBLE',
  'createdAt': '2026-10-01T10:00:00.000Z',
  'updatedAt': '2026-10-01T10:00:00.000Z',
};

void main() {
  testWidgets(
    'customers can submit a review and then see their own review for editing',
    (tester) async {
      final adapter = _ReviewAdapter();
      final repository = ProviderDirectoryRepository(
        dio: Dio(BaseOptions(baseUrl: 'https://example.test/api/v1/'))
          ..httpClientAdapter = adapter,
      );
      await tester.pumpWidget(
        ProviderScope(
          overrides: [providerDirectoryRepositoryProvider.overrideWithValue(repository)],
          child: MaterialApp(
            locale: const Locale('en'),
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            home: Scaffold(
              body: ListView(
                children: const [
                  ProviderReviewsSection(
                    providerId: '33333333-3333-4333-8333-333333333333',
                    languageCode: 'en',
                  ),
                ],
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Customer reviews'), findsOneWidget);
      expect(find.text('Write a review'), findsOneWidget);
      expect(find.text('No customer reviews yet.'), findsOneWidget);

      await tester.tap(find.text('Write a review'));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextField), 'Helpful service.');
      await tester.tap(find.text('Submit review'));
      await tester.pumpAndSettle();

      expect(adapter.createRequest, isNotNull);
      expect(adapter.createRequest!.data, {
        'rating': 5,
        'reviewText': 'Helpful service.',
      });
      expect(find.text('Your review was submitted.'), findsOneWidget);
      expect(find.text('Your review'), findsOneWidget);
      expect(find.text('Edit your review'), findsOneWidget);
    },
  );

  testWidgets('uses Kannada labels for the review screen', (tester) async {
    final adapter = _ReviewAdapter();
    final repository = ProviderDirectoryRepository(
      dio: Dio(BaseOptions(baseUrl: 'https://example.test/api/v1/'))
        ..httpClientAdapter = adapter,
    );
    await tester.pumpWidget(
      ProviderScope(
        overrides: [providerDirectoryRepositoryProvider.overrideWithValue(repository)],
        child: MaterialApp(
          locale: const Locale('kn'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: Scaffold(
            body: ListView(
              children: const [
                ProviderReviewsSection(
                  providerId: '33333333-3333-4333-8333-333333333333',
                  languageCode: 'kn',
                ),
              ],
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('ಗ್ರಾಹಕರ ವಿಮರ್ಶೆಗಳು'), findsOneWidget);
    expect(find.text('ವಿಮರ್ಶೆ ಬರೆಯಿರಿ'), findsOneWidget);
  });
}
