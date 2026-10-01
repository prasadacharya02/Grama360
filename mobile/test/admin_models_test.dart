import 'package:flutter_test/flutter_test.dart';

import '../lib/features/admin/admin_models.dart';

void main() {
  test('parses administrator roles and keeps support read-only', () {
    expect(AdminAccess.fromJson({'role': 'MODERATOR'}).canReview, isTrue);
    expect(AdminAccess.fromJson({'role': 'SUPPORT'}).canReview, isFalse);
    expect(
      () => AdminAccess.fromJson({'role': 'PROVIDER'}),
      throwsA(isA<FormatException>()),
    );
  });

  test('parses a pending review queue with localized service details', () {
    final queue = AdminReviewQueue.fromJson({
      'items': [
        {
          'id': '33333333-3333-4333-8333-333333333333',
          'displayName': 'Gopal Rao',
          'businessName': null,
          'primaryPhoneNumber': '+919876543210',
          'secondaryPhoneNumber': null,
          'profilePhotoPath': null,
          'serviceRadiusKm': '12.50',
          'experienceYears': 8,
          'description': null,
          'locality': 'Kusugal',
          'taluk': 'Hubballi',
          'district': 'Dharwad',
          'state': 'Karnataka',
          'locationLanguage': 'en',
          'services': [
            {
              'id': '11111111-1111-4111-8111-111111111111',
              'slug': 'electrician',
              'nameEn': 'Electrician',
              'nameKn': 'ಎಲೆಕ್ಟ್ರಿಷಿಯನ್',
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
          'submittedAt': '2026-10-01T10:00:00.000Z',
        },
      ],
      'total': 1,
      'limit': 25,
      'offset': 0,
    });

    final review = queue.items.single;
    expect(review.displayName, 'Gopal Rao');
    expect(review.serviceRadiusKm, 12.5);
    expect(review.services.single.nameFor('kn'), 'ಎಲೆಕ್ಟ್ರಿಷಿಯನ್');
    expect(review.workingHours.single.isClosed, isTrue);
    expect(review.submittedAt.toUtc().toIso8601String(), '2026-10-01T10:00:00.000Z');
  });
}
