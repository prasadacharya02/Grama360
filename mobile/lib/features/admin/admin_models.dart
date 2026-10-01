import '../provider_registration/provider_models.dart';

class AdminAccess {
  const AdminAccess({required this.role});

  final String role;

  bool get canReview => role == 'SUPER_ADMIN' || role == 'MODERATOR';

  factory AdminAccess.fromJson(Object? value) {
    final json = _asJsonMap(value, 'administrator access');
    final role = _requiredString(json, 'role');
    if (!const {'SUPER_ADMIN', 'MODERATOR', 'SUPPORT'}.contains(role)) {
      throw const FormatException('Administrator role is invalid.');
    }
    return AdminAccess(role: role);
  }
}

class AdminReviewService {
  const AdminReviewService({
    required this.id,
    required this.slug,
    required this.nameEn,
    required this.nameKn,
    required this.isPrimary,
  });

  final String id;
  final String slug;
  final String nameEn;
  final String nameKn;
  final bool isPrimary;

  String nameFor(String languageCode) => languageCode == 'kn' ? nameKn : nameEn;

  factory AdminReviewService.fromJson(Object? value) {
    final json = _asJsonMap(value, 'review service');
    return AdminReviewService(
      id: _requiredString(json, 'id'),
      slug: _requiredString(json, 'slug'),
      nameEn: _requiredString(json, 'nameEn'),
      nameKn: _requiredString(json, 'nameKn'),
      isPrimary: json['isPrimary'] == true,
    );
  }
}

class PendingProviderReview {
  const PendingProviderReview({
    required this.id,
    required this.displayName,
    required this.businessName,
    required this.primaryPhoneNumber,
    required this.secondaryPhoneNumber,
    required this.profilePhotoPath,
    required this.serviceRadiusKm,
    required this.experienceYears,
    required this.description,
    required this.locality,
    required this.taluk,
    required this.district,
    required this.state,
    required this.locationLanguage,
    required this.services,
    required this.languages,
    required this.workingHours,
    required this.submittedAt,
  });

  final String id;
  final String displayName;
  final String? businessName;
  final String primaryPhoneNumber;
  final String? secondaryPhoneNumber;
  final String? profilePhotoPath;
  final double serviceRadiusKm;
  final int experienceYears;
  final String? description;
  final String locality;
  final String? taluk;
  final String district;
  final String state;
  final String locationLanguage;
  final List<AdminReviewService> services;
  final List<String> languages;
  final List<ProviderWorkingHour> workingHours;
  final DateTime submittedAt;

  factory PendingProviderReview.fromJson(Object? value) {
    final json = _asJsonMap(value, 'pending provider review');
    final services = json['services'];
    final languages = json['languages'];
    final hours = json['workingHours'];
    if (services is! List || languages is! List || hours is! List) {
      throw const FormatException('Provider review details are incomplete.');
    }
    final parsedLanguages = languages.map((language) {
      if (language is! String) {
        throw const FormatException('Provider language is invalid.');
      }
      return language;
    }).toList(growable: false);
    final radiusValue = json['serviceRadiusKm'];
    final radius = radiusValue is num
        ? radiusValue.toDouble()
        : double.tryParse(radiusValue?.toString() ?? '');
    if (radius == null || !radius.isFinite) {
      throw const FormatException('Provider service radius is invalid.');
    }
    final submittedAtValue = _requiredString(json, 'submittedAt');
    final submittedAt = DateTime.tryParse(submittedAtValue);
    if (submittedAt == null) {
      throw const FormatException('Provider submission time is invalid.');
    }

    return PendingProviderReview(
      id: _requiredString(json, 'id'),
      displayName: _requiredString(json, 'displayName'),
      businessName: json['businessName'] as String?,
      primaryPhoneNumber: _requiredString(json, 'primaryPhoneNumber'),
      secondaryPhoneNumber: json['secondaryPhoneNumber'] as String?,
      profilePhotoPath: json['profilePhotoPath'] as String?,
      serviceRadiusKm: radius,
      experienceYears: _requiredNumber(json, 'experienceYears').toInt(),
      description: json['description'] as String?,
      locality: _requiredString(json, 'locality'),
      taluk: json['taluk'] as String?,
      district: _requiredString(json, 'district'),
      state: _requiredString(json, 'state'),
      locationLanguage: _requiredString(json, 'locationLanguage'),
      services: services.map(AdminReviewService.fromJson).toList(growable: false),
      languages: parsedLanguages,
      workingHours: hours.map(ProviderWorkingHour.fromJson).toList(growable: false),
      submittedAt: submittedAt,
    );
  }
}

class AdminReviewQueue {
  const AdminReviewQueue({
    required this.items,
    required this.total,
    required this.limit,
    required this.offset,
  });

  final List<PendingProviderReview> items;
  final int total;
  final int limit;
  final int offset;

  factory AdminReviewQueue.fromJson(Object? value) {
    final json = _asJsonMap(value, 'provider review queue');
    final items = json['items'];
    if (items is! List) {
      throw const FormatException('Provider review queue is invalid.');
    }
    return AdminReviewQueue(
      items: items.map(PendingProviderReview.fromJson).toList(growable: false),
      total: _requiredNumber(json, 'total').toInt(),
      limit: _requiredNumber(json, 'limit').toInt(),
      offset: _requiredNumber(json, 'offset').toInt(),
    );
  }
}

class ProviderReviewDecision {
  const ProviderReviewDecision({required this.decision, this.note});

  final String decision;
  final String? note;
}

class AdminMfaRequiredException implements Exception {
  const AdminMfaRequiredException({
    required this.reauthenticate,
    this.enrollmentRequired = false,
  });

  final bool reauthenticate;
  final bool enrollmentRequired;
}

Map<String, dynamic> _asJsonMap(Object? value, String label) {
  if (value is! Map) throw FormatException('Invalid $label response.');
  try {
    return Map<String, dynamic>.from(value);
  } on TypeError {
    throw FormatException('Invalid $label response.');
  }
}

String _requiredString(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is! String) throw FormatException('Missing $key in API response.');
  return value;
}

num _requiredNumber(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is num) return value;
  final parsed = num.tryParse(value?.toString() ?? '');
  if (parsed == null) throw FormatException('Invalid $key in API response.');
  return parsed;
}
