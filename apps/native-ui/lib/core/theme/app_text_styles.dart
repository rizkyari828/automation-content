import 'package:flutter/material.dart';

import 'app_colors.dart';

class AppTextStyles {
  const AppTextStyles._();

  static TextTheme textTheme() {
    return const TextTheme(
      headlineLarge: TextStyle(
        fontSize: 40,
        height: 1.02,
        fontWeight: FontWeight.w800,
        letterSpacing: -1.4,
        color: AppColors.ink,
      ),
      headlineMedium: TextStyle(
        fontSize: 28,
        height: 1.08,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.8,
        color: AppColors.ink,
      ),
      headlineSmall: TextStyle(
        fontSize: 22,
        height: 1.12,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.5,
        color: AppColors.ink,
      ),
      titleLarge: TextStyle(
        fontSize: 20,
        height: 1.18,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.45,
        color: AppColors.ink,
      ),
      titleMedium: TextStyle(
        fontSize: 16,
        height: 1.24,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.2,
        color: AppColors.ink,
      ),
      titleSmall: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.2,
        color: AppColors.ink,
      ),
      bodyLarge: TextStyle(
        fontSize: 16,
        height: 1.58,
        color: AppColors.ink,
      ),
      bodyMedium: TextStyle(
        fontSize: 15,
        height: 1.6,
        color: AppColors.muted,
      ),
      bodySmall: TextStyle(
        fontSize: 13,
        height: 1.45,
        color: AppColors.muted,
      ),
      labelLarge: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.1,
      ),
      labelMedium: TextStyle(
        fontSize: 11.5,
        fontWeight: FontWeight.w800,
        letterSpacing: 1,
        color: AppColors.mutedStrong,
      ),
      labelSmall: TextStyle(
        fontSize: 10.5,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.9,
        color: AppColors.muted,
      ),
    );
  }
}
