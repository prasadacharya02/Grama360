import 'package:flutter/foundation.dart';

class DiscoveryCategory {
  const DiscoveryCategory({
    required this.id,
    required this.parentId,
    required this.name,
    required this.sortOrder,
  });

  final String id;
  final String? parentId;
  final String name;
  final int sortOrder;

  factory DiscoveryCategory.fromJson(Object? value) {
    final json = _asMap(value, 'service category');
    return DiscoveryCategory(
      id: _requiredString(json, 'id'),
      parentId: json['parentId'] as String?,
      name: _requiredString(json, 'name'),
      sortOrder: _requiredNumber(json['sortOrder'], 'sortOrder').toInt(),
    );
  }
}

@immutable
class ProviderSearchRequest {
  const ProviderSearchRequest({
    required this.languageCode,
    this.categoryId,
    this.query,
    this.location,
    this.availableNow = false,
    this.limit = 20,
    this.offset = 0,
  });

  final String languageCode;
  final String? categoryId;
  final String? query;
  final String? location;
  final bool availableNow;
  final int limit;
  final int offset;

  ProviderSearchRequest withOffset(int value) => ProviderSearchRequest(
        languageCode: languageCode,
        categoryId: categoryId,
        query: query,
        location: location,
        availableNow: availableNow,
        limit: limit,
        offset: value,
      );

  Map<String, Object> toQueryParameters() => {
        'language': languageCode,
        'limit': limit,
        'offset': offset,
        if (categoryId != null) 'categoryId': categoryId!,
        if (query != null && query!.trim().isNotEmpty) 'q': query!.trim(),
        if (location != null && location!.trim().isNotEmpty)
          'location': location!.trim(),
        if (availableNow) 'availableNow': true,
      };

  @override
  bool operator ==(Object other) =>
      other is ProviderSearchRequest &&
      other.languageCode == languageCode &&
      other.categoryId == categoryId &&
      other.query == query &&
      other.location == location &&
      other.availableNow == availableNow &&
      other.limit == limit &&
      other.offset == offset;

  @override
  int get hashCode =>
      Object.hash(languageCode, categoryId, query, location, availableNow, limit, offset);
}

class ProviderDiscoveryPage {
  const ProviderDiscoveryPage({
    required this.items,
    required this.hasMore,
    this.nextCursor,
  });

  final List<PublicProviderSummary> items;
  final bool hasMore;
  final String? nextCursor;

  factory ProviderDiscoveryPage.fromJson(Object? value) {
    final json = _asMap(value, 'provider search');
    final items = json['items'];
    if (items is! List || json['hasMore'] is! bool) {
      throw const FormatException('The provider search response is incomplete.');
    }
    return ProviderDiscoveryPage(
      items: items.map(PublicProviderSummary.fromJson).toList(growable: false),
      hasMore: json['hasMore'] as bool,
      nextCursor: _optionalString(json['nextCursor'], 'nextCursor'),
    );
  }
}

class PublicProviderReview {
  const PublicProviderReview({
    required this.id,
    required this.rating,
    required this.reviewText,
    required this.reviewerDisplayName,
    required this.createdAt,
    required this.isMine,
  });

  final String id;
  final int rating;
  final String? reviewText;
  final String reviewerDisplayName;
  final String createdAt;
  final bool isMine;

  factory PublicProviderReview.fromJson(Object? value) {
    final json = _asMap(value, 'provider review');
    final rawRating = _requiredNumber(json['rating'], 'rating');
    final rating = rawRating.toInt();
    if (rawRating != rating || rating < 1 || rating > 5 || json['isMine'] is! bool) {
      throw const FormatException('The provider review response is invalid.');
    }
    return PublicProviderReview(
      id: _requiredString(json, 'id'),
      rating: rating,
      reviewText: _optionalString(json['reviewText'], 'reviewText'),
      reviewerDisplayName: _requiredString(json, 'reviewerDisplayName'),
      createdAt: _requiredString(json, 'createdAt'),
      isMine: json['isMine'] as bool,
    );
  }
}

class CustomerProviderReview {
  const CustomerProviderReview({
    required this.id,
    required this.rating,
    required this.reviewText,
    required this.moderationStatus,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final int rating;
  final String? reviewText;
  final String moderationStatus;
  final String createdAt;
  final String updatedAt;

  factory CustomerProviderReview.fromJson(Object? value) {
    final json = _asMap(value, 'your review');
    final rawRating = _requiredNumber(json['rating'], 'rating');
    final rating = rawRating.toInt();
    final status = _requiredString(json, 'moderationStatus');
    if (rawRating != rating || rating < 1 || rating > 5 ||
        !const {'VISIBLE', 'HIDDEN', 'PENDING'}.contains(status)) {
      throw const FormatException('Your review response is invalid.');
    }
    return CustomerProviderReview(
      id: _requiredString(json, 'id'),
      rating: rating,
      reviewText: _optionalString(json['reviewText'], 'reviewText'),
      moderationStatus: status,
      createdAt: _requiredString(json, 'createdAt'),
      updatedAt: _requiredString(json, 'updatedAt'),
    );
  }
}

class ProviderReviewPage {
  const ProviderReviewPage({
    required this.items,
    required this.hasMore,
    required this.nextCursor,
    required this.myReview,
  });

  final List<PublicProviderReview> items;
  final bool hasMore;
  final String? nextCursor;
  final CustomerProviderReview? myReview;

  factory ProviderReviewPage.fromJson(Object? value) {
    final json = _asMap(value, 'provider reviews');
    final items = json['items'];
    if (items is! List || json['hasMore'] is! bool) {
      throw const FormatException('The provider reviews response is incomplete.');
    }
    return ProviderReviewPage(
      items: items.map(PublicProviderReview.fromJson).toList(growable: false),
      hasMore: json['hasMore'] as bool,
      nextCursor: _optionalString(json['nextCursor'], 'nextCursor'),
      myReview: json['myReview'] == null
          ? null
          : CustomerProviderReview.fromJson(json['myReview']),
    );
  }
}

class PublicProviderService {
  const PublicProviderService({
    required this.id,
    required this.name,
    required this.isPrimary,
  });

  final String id;
  final String name;
  final bool isPrimary;

  factory PublicProviderService.fromJson(Object? value) {
    final json = _asMap(value, 'provider service');
    return PublicProviderService(
      id: _requiredString(json, 'id'),
      name: _requiredString(json, 'name'),
      isPrimary: json['isPrimary'] == true,
    );
  }
}

class PublicProviderWorkingHour {
  const PublicProviderWorkingHour({
    required this.weekday,
    required this.isClosed,
    required this.opensAt,
    required this.closesAt,
  });

  final int weekday;
  final bool isClosed;
  final String? opensAt;
  final String? closesAt;

  factory PublicProviderWorkingHour.fromJson(Object? value) {
    final json = _asMap(value, 'provider working hours');
    return PublicProviderWorkingHour(
      weekday: _requiredNumber(json['weekday'], 'weekday').toInt(),
      isClosed: json['isClosed'] == true,
      opensAt: _optionalString(json['opensAt'], 'opensAt'),
      closesAt: _optionalString(json['closesAt'], 'closesAt'),
    );
  }
}

class PublicProviderSummary {
  const PublicProviderSummary({
    required this.id,
    required this.displayName,
    required this.businessName,
    required this.profilePhotoPath,
    required this.serviceRadiusKm,
    required this.experienceYears,
    required this.availability,
    required this.location,
    required this.services,
    required this.languages,
    required this.averageRating,
    required this.reviewCount,
  });

  final String id;
  final String displayName;
  final String? businessName;
  final String? profilePhotoPath;
  final double serviceRadiusKm;
  final int experienceYears;
  final String availability;
  final Map<String, String> location;
  final List<PublicProviderService> services;
  final List<String> languages;
  final double? averageRating;
  final int reviewCount;

  factory PublicProviderSummary.fromJson(Object? value) {
    final json = _asMap(value, 'provider');
    final location = _asMap(json['location'], 'provider location');
    final services = json['services'];
    final languages = json['languages'];
    if (services is! List || languages is! List) {
      throw const FormatException('Provider services or languages are missing.');
    }
    if (languages.any((language) => language is! String)) {
      throw const FormatException('Provider languages are invalid.');
    }
    final rawRating = json['averageRating'];
    return PublicProviderSummary(
      id: _requiredString(json, 'id'),
      displayName: _requiredString(json, 'displayName'),
      businessName: _optionalString(json['businessName'], 'businessName'),
      profilePhotoPath: _optionalString(json['profilePhotoPath'], 'profilePhotoPath'),
      serviceRadiusKm: _requiredNumber(json['serviceRadiusKm'], 'serviceRadiusKm').toDouble(),
      experienceYears: _requiredNumber(json['experienceYears'], 'experienceYears').toInt(),
      availability: _requiredString(json, 'availability'),
      location: {
        'locality': _requiredString(location, 'locality'),
        'district': _requiredString(location, 'district'),
        'state': _requiredString(location, 'state'),
        'languageCode': _requiredString(location, 'languageCode'),
      },
      services: services.map(PublicProviderService.fromJson).toList(growable: false),
      languages: languages.cast<String>(),
      averageRating: rawRating == null
          ? null
          : _requiredNumber(rawRating, 'averageRating').toDouble(),
      reviewCount: _requiredNumber(json['reviewCount'], 'reviewCount').toInt(),
    );
  }
}

class PublicProviderProfile extends PublicProviderSummary {
  const PublicProviderProfile({
    required super.id,
    required super.displayName,
    required super.businessName,
    required super.profilePhotoPath,
    required super.serviceRadiusKm,
    required super.experienceYears,
    required super.availability,
    required super.location,
    required super.services,
    required super.languages,
    required super.averageRating,
    required super.reviewCount,
    required this.description,
    required this.workingHours,
  });

  final String? description;
  final List<PublicProviderWorkingHour> workingHours;

  factory PublicProviderProfile.fromJson(Object? value) {
    final json = _asMap(value, 'provider profile');
    final hours = json['workingHours'];
    if (hours is! List) {
      throw const FormatException('Provider working hours are missing.');
    }
    final summary = PublicProviderSummary.fromJson(json);
    return PublicProviderProfile(
      id: summary.id,
      displayName: summary.displayName,
      businessName: summary.businessName,
      profilePhotoPath: summary.profilePhotoPath,
      serviceRadiusKm: summary.serviceRadiusKm,
      experienceYears: summary.experienceYears,
      availability: summary.availability,
      location: summary.location,
      services: summary.services,
      languages: summary.languages,
      averageRating: summary.averageRating,
      reviewCount: summary.reviewCount,
      description: _optionalString(json['description'], 'description'),
      workingHours: hours
          .map(PublicProviderWorkingHour.fromJson)
          .toList(growable: false),
    );
  }
}

Map<String, dynamic> _asMap(Object? value, String label) {
  if (value is! Map) throw FormatException('Invalid $label response.');
  try {
    return Map<String, dynamic>.from(value);
  } on TypeError {
    throw FormatException('Invalid $label response.');
  }
}

String _requiredString(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is! String || value.isEmpty) {
    throw FormatException('Missing $key in provider response.');
  }
  return value;
}

String? _optionalString(Object? value, String key) {
  if (value == null) return null;
  if (value is! String) throw FormatException('Invalid $key in provider response.');
  return value;
}

num _requiredNumber(Object? value, String key) {
  if (value is num) return value;
  final parsed = num.tryParse(value?.toString() ?? '');
  if (parsed == null || !parsed.isFinite) {
    throw FormatException('Invalid $key in provider response.');
  }
  return parsed;
}
