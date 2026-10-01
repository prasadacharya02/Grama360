class AppSession {
  const AppSession({
    required this.userId,
    required this.phoneNumber,
    required this.fullName,
    required this.preferredLanguage,
    required this.roles,
    required this.onboardingComplete,
  });

  final String userId;
  final String phoneNumber;
  final String? fullName;
  final String preferredLanguage;
  final List<String> roles;
  final bool onboardingComplete;

  factory AppSession.fromJson(Object? value) {
    if (value is! Map) throw const FormatException('Invalid session response.');
    final session = Map<String, dynamic>.from(value);
    final userValue = session['user'];
    if (userValue is! Map) throw const FormatException('Missing account details.');
    final user = Map<String, dynamic>.from(userValue);
    final rolesValue = session['roles'];
    if (rolesValue is! List) throw const FormatException('Missing account roles.');

    return AppSession(
      userId: user['id'] as String,
      phoneNumber: user['phoneNumber'] as String,
      fullName: user['fullName'] as String?,
      preferredLanguage: user['preferredLanguage'] as String,
      roles: rolesValue.cast<String>(),
      onboardingComplete: session['onboardingComplete'] as bool? ?? false,
    );
  }
}
