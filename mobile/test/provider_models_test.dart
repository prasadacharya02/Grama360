import 'package:flutter_test/flutter_test.dart';

import 'package:grama360/features/provider_registration/provider_models.dart';

void main() {
  test('parses localized category IDs and parent relationships', () {
    final category = ServiceCategory.fromJson({
      'id': '11111111-1111-4111-8111-111111111111',
      'parentId': null,
      'slug': 'electrician',
      'name': 'ಎಲೆಕ್ಟ್ರಿಷಿಯನ್',
      'iconKey': 'electrical_services',
      'sortOrder': 10,
    });

    expect(category.slug, 'electrician');
    expect(category.name, 'ಎಲೆಕ್ಟ್ರಿಷಿಯನ್');
    expect(category.parentId, isNull);
  });

  test('parses provider profile location, services, and PostgreSQL numeric values', () {
    final profile = ProviderProfile.fromJson({
      'id': '33333333-3333-4333-8333-333333333333',
      'displayName': 'Gopal Rao',
      'businessName': null,
      'secondaryPhoneNumber': null,
      'serviceRadiusKm': '12.50',
      'experienceYears': 8,
      'description': null,
      'profilePhotoPath': null,
      'profileStatus': 'PENDING_REVIEW',
      'reviewNote': null,
      'availability': 'OFFLINE',
      'location': {
        'locality': 'ಕುಸುಗಲ್',
        'taluk': 'ಹುಬ್ಬಳ್ಳಿ',
        'district': 'ಧಾರವಾಡ',
        'state': 'Karnataka',
        'languageCode': 'kn',
      },
      'services': [
        {
          'id': '11111111-1111-4111-8111-111111111111',
          'slug': 'electrician',
          'name': 'Electrician',
          'isPrimary': true,
        },
      ],
      'languages': ['kn', 'en'],
      'workingHours': [
        {
          'weekday': 0,
          'isClosed': true,
          'opensAt': null,
          'closesAt': null,
        },
      ],
    });

    expect(profile.serviceRadiusKm, 12.5);
    expect(profile.profileStatus, 'PENDING_REVIEW');
    expect(profile.location['languageCode'], 'kn');
    expect(profile.services.single.isPrimary, isTrue);
    expect(profile.languages, ['kn', 'en']);
    expect(profile.workingHours.single.toJson(), {
      'weekday': 0,
      'isClosed': true,
      'opensAt': null,
      'closesAt': null,
    });
  });

  test('parses provider-facing rejection notes', () {
    final profile = ProviderProfile.fromJson({
      'id': '33333333-3333-4333-8333-333333333333',
      'displayName': 'Gopal Rao',
      'businessName': null,
      'secondaryPhoneNumber': null,
      'serviceRadiusKm': 10,
      'experienceYears': 2,
      'description': null,
      'profilePhotoPath': null,
      'profileStatus': 'REJECTED',
      'reviewNote': 'Please add a clearer locality.',
      'availability': 'OFFLINE',
      'location': {
        'locality': 'Kusugal',
        'taluk': null,
        'district': 'Dharwad',
        'state': 'Karnataka',
        'languageCode': 'en',
      },
      'services': <Object>[],
      'languages': ['kn'],
      'workingHours': <Object>[],
    });

    expect(profile.profileStatus, 'REJECTED');
    expect(profile.reviewNote, 'Please add a clearer locality.');
  });

  test('rejects malformed provider data instead of trusting response shape', () {
    expect(
      () => ProviderProfile.fromJson({'id': 'missing-fields'}),
      throwsA(isA<FormatException>()),
    );
  });
}
