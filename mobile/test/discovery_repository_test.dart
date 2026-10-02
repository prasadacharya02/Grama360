import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:grama360/features/discovery/discovery_repository.dart';

class _RecordingAdapter implements HttpClientAdapter {
  final List<RequestOptions> requests = [];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
    final review = {
      'id': '44444444-4444-4444-8444-444444444444',
      'rating': 5,
      'reviewText': 'Helpful service.',
      'moderationStatus': 'VISIBLE',
      'createdAt': '2026-10-01T10:00:00.000Z',
      'updatedAt': '2026-10-01T10:00:00.000Z',
    };
    final Object body = switch (options.method) {
      'GET' when options.path.endsWith('/reviews') => {
          'items': [],
          'hasMore': false,
          'nextCursor': null,
          'myReview': null,
        },
      'POST' || 'PATCH' => {'review': review},
      _ => {
          'items': [],
          'hasMore': true,
          'nextCursor': 'next-page-cursor',
        },
    };
    return ResponseBody.fromString(
      jsonEncode(body),
      200,
      headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
    );
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  test('uses opaque cursors for favorites and provider review pages', () async {
    final adapter = _RecordingAdapter();
    final dio = Dio(BaseOptions(baseUrl: 'https://example.test/api/v1/'))
      ..httpClientAdapter = adapter;
    final repository = ProviderDirectoryRepository(dio: dio);

    final favorites = await repository.loadFavorites(
      languageCode: 'kn',
      limit: 10,
      cursor: 'favorite-cursor',
    );
    final reviews = await repository.loadReviews(
      providerId: '33333333-3333-4333-8333-333333333333',
      limit: 15,
      cursor: 'review-cursor',
    );

    expect(favorites.nextCursor, 'next-page-cursor');
    expect(adapter.requests[0].queryParameters, {
      'language': 'kn',
      'limit': 10,
      'cursor': 'favorite-cursor',
    });
    expect(reviews.items, isEmpty);
    expect(adapter.requests[1].path, endsWith('/reviews'));
    expect(adapter.requests[1].queryParameters, {
      'limit': 15,
      'cursor': 'review-cursor',
    });
  });

  test('creates and edits a review with only its rating and optional text', () async {
    final adapter = _RecordingAdapter();
    final dio = Dio(BaseOptions(baseUrl: 'https://example.test/api/v1/'))
      ..httpClientAdapter = adapter;
    final repository = ProviderDirectoryRepository(dio: dio);

    final created = await repository.createReview(
      providerId: '33333333-3333-4333-8333-333333333333',
      rating: 5,
      reviewText: '  Helpful service.  ',
    );
    final updated = await repository.updateReview(
      reviewId: '44444444-4444-4444-8444-444444444444',
      rating: 4,
    );

    expect(created.reviewText, 'Helpful service.');
    expect(updated.rating, 5);
    expect(adapter.requests[0].method, 'POST');
    expect(adapter.requests[0].data, {
      'rating': 5,
      'reviewText': 'Helpful service.',
    });
    expect(adapter.requests[1].method, 'PATCH');
    expect(adapter.requests[1].data, {'rating': 4, 'reviewText': null});
  });
}
