import 'package:flutter_test/flutter_test.dart';
import 'package:grama360/features/auth/app_session.dart';

void main() {
  test('parses the backend account and app roles', () {
    final session = AppSession.fromJson({
      'user': {
        'id': '6c6aa9c8-6d30-45b2-9d1a-6bb9dbade775',
        'phoneNumber': '+919876543210',
        'fullName': null,
        'preferredLanguage': 'kn',
      },
      'roles': ['CUSTOMER'],
      'onboardingComplete': true,
    });

    expect(session.phoneNumber, '+919876543210');
    expect(session.preferredLanguage, 'kn');
    expect(session.roles, ['CUSTOMER']);
    expect(session.onboardingComplete, isTrue);
  });

  test('rejects incomplete server session payloads', () {
    expect(
      () => AppSession.fromJson({'roles': []}),
      throwsA(isA<FormatException>()),
    );
  });
}
