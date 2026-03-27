import 'package:flutter/material.dart';

import '../../../core/localization/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/creatorflow_primitives.dart';

class ContentScreen extends StatelessWidget {
  const ContentScreen({super.key});

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
                            ? 'Pipeline konten'
                            : 'Content pipeline',
                        onDark: true,
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Text(
                        strings.contentPipeline,
                        style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                              color: Colors.white,
                            ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Text(
                        strings.contentPipelineBody,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              color: Colors.white.withValues(alpha: 0.8),
                            ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                _PlaceholderCard(
                  title: Localizations.localeOf(context).languageCode == 'id'
                      ? 'Create, review, publish'
                      : 'Create, review, publish',
                  body: Localizations.localeOf(context).languageCode == 'id'
                      ? 'Versi native ini sekarang mengikuti ritme visual web baru: card yang lebih tenang, hierarchy lebih jelas, dan CTA yang terasa lebih premium.'
                      : 'This native view now follows the refreshed web rhythm, with calmer cards, clearer hierarchy, and more premium call-to-actions.',
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _PlaceholderCard extends StatelessWidget {
  const _PlaceholderCard({required this.title, required this.body});

  final String title;
  final String body;

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
            Text(body),
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
                Icons.auto_awesome_motion_rounded,
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
