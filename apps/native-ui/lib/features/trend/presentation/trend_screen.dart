import 'package:flutter/material.dart';

import '../../../core/localization/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/creatorflow_primitives.dart';

class TrendScreen extends StatelessWidget {
  const TrendScreen({super.key});

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
                            ? 'Trend intelligence'
                            : 'Trend intelligence',
                        onDark: true,
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Text(
                        strings.watchlistOverview,
                        style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                              color: Colors.white,
                            ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Text(
                        strings.watchlistOverviewBody,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              color: Colors.white.withValues(alpha: 0.8),
                            ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                _TrendCard(
                  title: Localizations.localeOf(context).languageCode == 'id'
                      ? 'Watchlist dan digest'
                      : 'Watchlist and digest',
                  subtitle: Localizations.localeOf(context).languageCode == 'id'
                      ? 'Gunakan shell ini sebagai basis card-first untuk rekomendasi tren yang lebih mudah dipindai di mobile maupun desktop.'
                      : 'Use this shell as a card-first base for trend recommendations that scan better across mobile and desktop.',
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _TrendCard extends StatelessWidget {
  const _TrendCard({required this.title, required this.subtitle});

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
                Icons.auto_graph_rounded,
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
