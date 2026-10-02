class ServiceCategory {
  const ServiceCategory({
    required this.id,
    required this.parentId,
    required this.slug,
    required this.name,
    required this.iconKey,
    required this.sortOrder,
  });

  final String id;
  final String? parentId;
  final String slug;
  final String name;
  final String? iconKey;
  final int sortOrder;

  factory ServiceCategory.fromJson(Object? value) {
    final json = _asJsonMap(value, 'service category');
    return ServiceCategory(
      id: _requiredString(json, 'id'),
      parentId: json['parentId'] as String?,
      slug: _requiredString(json, 'slug'),
      name: _requiredString(json, 'name'),
      iconKey: json['iconKey'] as String?,
      sortOrder: _requiredNumber(json, 'sortOrder').toInt(),
    );
  }
}

class ProviderService {
  const ProviderService({
    required this.id,
    required this.slug,
    required this.name,
    required this.isPrimary,
  });

  final String id;
  final String slug;
  final String name;
  final bool isPrimary;

  factory ProviderService.fromJson(Object? value) {
    final json = _asJsonMap(value, 'provider service');
    return ProviderService(
      id: _requiredString(json, 'id'),
      slug: _requiredString(json, 'slug'),
      name: _requiredString(json, 'name'),
      isPrimary: json['isPrimary'] == true,
    );
  }
}

class ProviderWorkingHour {
  const ProviderWorkingHour({
    required this.weekday,
    required this.isClosed,
    required this.opensAt,
    required this.closesAt,
  });

  final int weekday;
  final bool isClosed;
  final String? opensAt;
  final String? closesAt;

  factory ProviderWorkingHour.fromJson(Object? value) {
    final json = _asJsonMap(value, 'working hour');
    return ProviderWorkingHour(
      weekday: _requiredNumber(json, 'weekday').toInt(),
      isClosed: json['isClosed'] == true,
      opensAt: _timeString(json['opensAt']),
      closesAt: _timeString(json['closesAt']),
    );
  }

  Map<String, Object?> toJson() => {
        'weekday': weekday,
        'isClosed': isClosed,
        'opensAt': opensAt,
        'closesAt': closesAt,
      };
}

class ProviderProfile {
  const ProviderProfile({
    required this.id,
    required this.displayName,
    required this.businessName,
    required this.secondaryPhoneNumber,
    required this.serviceRadiusKm,
    required this.experienceYears,
    required this.description,
    required this.profilePhotoPath,
    required this.profileStatus,
    required this.reviewNote,
    required this.availability,
    required this.location,
    required this.services,
    required this.languages,
    required this.workingHours,
  });

  final String id;
  final String displayName;
  final String? businessName;
  final String? secondaryPhoneNumber;
  final double serviceRadiusKm;
  final int experienceYears;
  final String? description;
  final String? profilePhotoPath;
  final String profileStatus;
  final String? reviewNote;
  final String availability;
  final Map<String, String?> location;
  final List<ProviderService> services;
  final List<String> languages;
  final List<ProviderWorkingHour> workingHours;

  factory ProviderProfile.fromJson(Object? value) {
    final json = _asJsonMap(value, 'provider profile');
    final location = _asJsonMap(json['location'], 'provider location');
    final services = json['services'];
    final languages = json['languages'];
    final workingHours = json['workingHours'];
    if (services is! List || languages is! List || workingHours is! List) {
      throw const FormatException('Provider profile details are incomplete.');
    }

    final radiusValue = json['serviceRadiusKm'];
    final radius = radiusValue is num
        ? radiusValue.toDouble()
        : double.tryParse(radiusValue?.toString() ?? '');
    if (radius == null || !radius.isFinite) {
      throw const FormatException('Provider service radius is invalid.');
    }

    return ProviderProfile(
      id: _requiredString(json, 'id'),
      displayName: _requiredString(json, 'displayName'),
      businessName: json['businessName'] as String?,
      secondaryPhoneNumber: json['secondaryPhoneNumber'] as String?,
      serviceRadiusKm: radius,
      experienceYears: _requiredNumber(json, 'experienceYears').toInt(),
      description: json['description'] as String?,
      profilePhotoPath: json['profilePhotoPath'] as String?,
      profileStatus: _requiredString(json, 'profileStatus'),
      reviewNote: json['reviewNote'] as String?,
      availability: _requiredString(json, 'availability'),
      location: {
        'locality': _requiredString(location, 'locality'),
        'taluk': location['taluk'] as String?,
        'district': _requiredString(location, 'district'),
        'state': _requiredString(location, 'state'),
        'languageCode': _requiredString(location, 'languageCode'),
      },
      services: services.map(ProviderService.fromJson).toList(growable: false),
      languages: languages.map((language) {
        if (language is! String) {
          throw const FormatException('Provider language is invalid.');
        }
        return language;
      }).toList(growable: false),
      workingHours: workingHours
          .map(ProviderWorkingHour.fromJson)
          .toList(growable: false),
    );
  }
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
  if (value is! String) throw FormatException('Missing $key in provider response.');
  return value;
}

num _requiredNumber(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is num) return value;
  final parsed = num.tryParse(value?.toString() ?? '');
  if (parsed == null) throw FormatException('Invalid $key in provider response.');
  return parsed;
}

String? _timeString(Object? value) {
  if (value == null) return null;
  if (value is! String) throw const FormatException('Invalid provider working hours.');
  return value.length >= 5 ? value.substring(0, 5) : value;
}
