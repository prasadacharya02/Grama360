import 'package:flutter_test/flutter_test.dart';
import 'package:grama360/features/discovery/discovery_models.dart';

void main() {
  const providerId = '33333333-3333-4333-8333-333333333333';
  const serviceId = '11111111-1111-4111-8111-111111111111';

  test('builds stable search filters with trimmed text and page offsets', () {
    const request = ProviderSearchRequest(
      languageCode: 'kn',
      categoryId: serviceId,
      query: '  ಎಲೆಕ್ಟ್ರಿಷಿಯನ್  ',
      location: ' ಹುಬ್ಬಳ್ಳಿ ',
    );

    expect(request.toQueryParameters(), {
      'language': 'kn',
      'limit': 20,
      'offset': 0,
      'categoryId': serviceId,
      'q': 'ಎಲೆಕ್ಟ್ರಿಷಿಯನ್',
      'location': 'ಹುಬ್ಬಳ್ಳಿ',
    });
    expect(request.withOffset(20).offset, 20);
    expect(request.withOffset(20), isNot(request));
  });

  test('preserves the Available now filter when serializing and paging', () {
    const request = ProviderSearchRequest(
      languageCode: 'en',
      availableNow: true,
    );

    expect(request.toQueryParameters()['availableNow'], isTrue);
    expect(request.withOffset(20).availableNow, isTrue);
    expect(request.withOffset(20), isNot(request));
  });

  test('parses a public provider search result without a contact number', () {
    final page = ProviderDiscoveryPage.fromJson({
      'items': [
        {
          'id': providerId,
          'displayName': 'Gopal Rao',
          'businessName': 'Gopal Electricals',
          'profilePhotoPath': null,
          'serviceRadiusKm': '20.00',
          'experienceYears': 5,
          'availability': 'AVAILABLE',
          'location': {
            'locality': 'ಕುಸುಗಲ್',
            'district': 'ಧಾರವಾಡ',
            'state': 'ಕರ್ನಾಟಕ',
            'languageCode': 'kn',
          },
          'services': [
            {'id': serviceId, 'slug': 'electrician', 'name': 'ಎಲೆಕ್ಟ್ರಿಷಿಯನ್', 'isPrimary': true},
          ],
          'languages': ['kn', 'en'],
          'averageRating': '4.8',
          'reviewCount': 12,
        },
      ],
      'hasMore': true,
      'limit': 20,
      'offset': 0,
    });

    expect(page.items, hasLength(1));
    expect(page.items.single.location['locality'], 'ಕುಸುಗಲ್');
    expect(page.items.single.averageRating, 4.8);
    expect(page.items.single.reviewCount, 12);
    expect(page.hasMore, isTrue);
  });

  test('parses provider hours and nullable rating on the public profile', () {
    final profile = PublicProviderProfile.fromJson({
      'id': providerId,
      'displayName': 'Gopal Rao',
      'businessName': null,
      'profilePhotoPath': null,
      'serviceRadiusKm': 12,
      'experienceYears': 4,
      'availability': 'OFFLINE',
      'location': {
        'locality': 'Kusugal',
        'district': 'Dharwad',
        'state': 'Karnataka',
        'languageCode': 'en',
      },
      'services': [
        {'id': serviceId, 'slug': 'electrician', 'name': 'Electrician', 'isPrimary': true},
      ],
      'languages': ['en'],
      'averageRating': null,
      'reviewCount': 0,
      'description': 'Electrical repairs',
      'workingHours': [
        {'weekday': 0, 'opensAt': null, 'closesAt': null, 'isClosed': true},
        {'weekday': 1, 'opensAt': '09:00', 'closesAt': '17:00', 'isClosed': false},
      ],
    });

    expect(profile.description, 'Electrical repairs');
    expect(profile.averageRating, isNull);
    expect(profile.workingHours, hasLength(2));
    expect(profile.workingHours[1].opensAt, '09:00');
    expect(profile.workingHours[0].isClosed, isTrue);
  });
}
