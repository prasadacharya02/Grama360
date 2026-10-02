import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Injected at startup so the language preference is loaded before the first frame.
final initialLocaleCodeProvider = Provider<String?>((ref) => null);

final appLocaleProvider = NotifierProvider<AppLocaleController, Locale?>(
  AppLocaleController.new,
);

class AppLocaleController extends Notifier<Locale?> {
  static const _preferenceKey = 'language_code';
  static const _supportedLanguageCodes = {'en', 'kn'};

  @override
  Locale? build() {
    final savedCode = ref.read(initialLocaleCodeProvider);
    if (savedCode == null || !_supportedLanguageCodes.contains(savedCode)) {
      return null;
    }
    return Locale(savedCode);
  }

  Future<void> selectLanguage(String languageCode) async {
    if (!_supportedLanguageCodes.contains(languageCode)) {
      throw ArgumentError.value(languageCode, 'languageCode', 'Unsupported language');
    }

    state = Locale(languageCode);
    try {
      final preferences = await SharedPreferences.getInstance();
      await preferences.setString(_preferenceKey, languageCode);
    } catch (_) {
      // Keep the in-memory language change even if local persistence is unavailable.
    }
  }

  Future<void> clearLanguage() async {
    state = null;
    try {
      final preferences = await SharedPreferences.getInstance();
      await preferences.remove(_preferenceKey);
    } catch (_) {
      // The current run still returns to the language choice screen.
    }
  }
}
