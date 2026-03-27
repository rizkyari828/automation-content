import 'package:flutter/material.dart';

import '../../../core/localization/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/creatorflow_primitives.dart';

class AssetsScreen extends StatelessWidget {
  const AssetsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1380),
            child: Column(
              children: [
                PremiumGradientCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SectionEyebrow(
                        Localizations.localeOf(context).languageCode == 'id'
                            ? 'Library aset'
                            : 'Asset library',
                        onDark: true,
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Text(
                        strings.assetLibrary,
                        style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                              color: Colors.white,
                            ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Text(
                        strings.assetLibraryBody,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              color: Colors.white.withValues(alpha: 0.8),
                            ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                _AssetCard(
                  title: Localizations.localeOf(context).languageCode == 'id'
                      ? 'Library yang lebih clean'
                      : 'A cleaner media library',
                  subtitle: Localizations.localeOf(context).languageCode == 'id'
                      ? 'Grid, preview, dan filter native sekarang lebih siap diarahkan ke visual CreatorFlow yang baru.'
                      : 'Grid, preview, and filtering can now align more closely with the refreshed CreatorFlow visual direction.',
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _AssetCard extends StatelessWidget {
  const _AssetCard({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return PremiumSurfaceCard(
      child: Padding(
        padding: EdgeInsets.zero,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: AppSpacing.sm),
            Text(subtitle),
            const SizedBox(height: AppSpacing.lg),
            Container(
              height: 180,
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppRadius.md),
                border: Border.all(color: AppColors.border),
              ),
              alignment: Alignment.center,
              child: const Icon(
                Icons.photo_library_rounded,
                size: 42,
                color: AppColors.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
