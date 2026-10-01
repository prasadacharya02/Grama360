import 'package:flutter/material.dart';

abstract final class AppTheme {
  static const _forest = Color(0xFF245B43);
  static const _leaf = Color(0xFF3E7958);
  static const _paper = Color(0xFFF7F8F3);
  static const _ink = Color(0xFF17251D);

  static ThemeData get light {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: _forest,
      brightness: Brightness.light,
      surface: Colors.white,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme.copyWith(
        primary: _forest,
        secondary: _leaf,
        surface: Colors.white,
      ),
      scaffoldBackgroundColor: _paper,
      textTheme: ThemeData.light().textTheme.apply(
            bodyColor: _ink,
            displayColor: _ink,
          ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(60),
          textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(60),
          textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }
}
