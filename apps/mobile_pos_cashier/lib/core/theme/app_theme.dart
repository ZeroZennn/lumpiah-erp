import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: const Color(0xFFFFC107),
      primary: const Color(0xFFFFB300),
      surface: Colors.white,
      onPrimary: Colors.white,
      onSurface: const Color(0xFF2D2D2D),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFFFFB300), // primary
        foregroundColor: Colors.white, // onPrimary
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFFFFB300), // primary
      foregroundColor: Colors.white, // onPrimary
    ),
  );
}
