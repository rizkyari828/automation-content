import 'package:flutter/material.dart';

import '../../../core/localization/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/creatorflow_primitives.dart';
import '../domain/social_auth_provider.dart';

class SocialAuthSection extends StatelessWidget {
  const SocialAuthSection({
    required this.busy,
    required this.intent,
    required this.onProviderTap,
    super.key,
  });

  final bool busy;
  final String intent;
  final void Function(SocialAuthProvider provider) onProviderTap;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final title = intent == 'register'
        ? strings.signUpWithProviders
        : strings.signInWithProviders;

    return LayoutBuilder(
      builder: (context, constraints) {
        final useTwoColumns = constraints.maxWidth >= 560;
        final buttonWidth = useTwoColumns
            ? (constraints.maxWidth - AppSpacing.sm) / 2
            : constraints.maxWidth;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Divider(
                    color: AppColors.borderStrong.withValues(alpha: 0.8),
                  ),
                ),
                Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                  child: Text(
                    title.toUpperCase(),
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          color: AppColors.muted,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                ),
                Expanded(
                  child: Divider(
                    color: AppColors.borderStrong.withValues(alpha: 0.8),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: SocialAuthProvider.values
                  .map(
                    (provider) => SizedBox(
                      width: buttonWidth,
                      child: OutlinedButton(
                        onPressed: busy ? null : () => onProviderTap(provider),
                        style: OutlinedButton.styleFrom(
                          backgroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.md,
                            vertical: 14,
                          ),
                          side: const BorderSide(color: AppColors.border),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(AppRadius.md),
                          ),
                          elevation: 0,
                          shadowColor: Colors.transparent,
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(
                                  AppRadius.pill,
                                ),
                                gradient: const LinearGradient(
                                  colors: [
                                    AppColors.ink,
                                    AppColors.primary,
                                    AppColors.accentWarm,
                                  ],
                                ),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                providerGlyph(provider),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                            const SizedBox(width: AppSpacing.md),
                            Expanded(
                              child: Text(
                                providerLabel(strings, provider),
                                style: Theme.of(context)
                                    .textTheme
                                    .titleSmall
                                    ?.copyWith(fontWeight: FontWeight.w700),
                              ),
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            const PremiumPill(
                              label: 'SSO',
                              background: AppColors.surfaceMuted,
                              foreground: AppColors.mutedStrong,
                              padding: EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 8,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                  .toList(growable: false),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              strings.nativeSsoHint,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: AppColors.muted),
            ),
          ],
        );
      },
    );
  }

  static String providerGlyph(SocialAuthProvider provider) {
    switch (provider) {
      case SocialAuthProvider.google:
        return 'G';
      case SocialAuthProvider.twitter:
        return 'X';
      case SocialAuthProvider.facebook:
        return 'f';
      case SocialAuthProvider.apple:
        return 'A';
    }
  }

  static String providerLabel(AppStrings strings, SocialAuthProvider provider) {
    switch (provider) {
      case SocialAuthProvider.google:
        return strings.continueWithGoogle;
      case SocialAuthProvider.twitter:
        return strings.continueWithTwitter;
      case SocialAuthProvider.facebook:
        return strings.continueWithFacebook;
      case SocialAuthProvider.apple:
        return strings.continueWithApple;
    }
  }
}
