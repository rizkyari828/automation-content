import 'package:flutter/material.dart';

import '../../../core/localization/locale_switcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/creatorflow_primitives.dart';

class AuthLayout extends StatelessWidget {
  const AuthLayout({
    required this.title,
    required this.subtitle,
    required this.formChild,
    required this.sideTitle,
    required this.sideBody,
    super.key,
    this.sideEyebrow,
  });

  final String title;
  final String subtitle;
  final Widget formChild;
  final String sideTitle;
  final String sideBody;
  final String? sideEyebrow;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final showSidePanel = width >= 980;

    return Scaffold(
      body: PremiumBackdrop(
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    minHeight: constraints.maxHeight - (AppSpacing.lg * 2),
                  ),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 1360),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Expanded(
                            flex: showSidePanel ? 5 : 1,
                            child: PremiumSurfaceCard(
                              padding: const EdgeInsets.all(AppSpacing.xl),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Expanded(
                                        child: CreatorFlowMark(),
                                      ),
                                      const LocaleSwitcher(compact: true),
                                    ],
                                  ),
                                  const SizedBox(height: AppSpacing.xl),
                                  Text(
                                    title,
                                    style: Theme.of(
                                      context,
                                    ).textTheme.headlineLarge,
                                  ),
                                  const SizedBox(height: AppSpacing.sm),
                                  ConstrainedBox(
                                    constraints:
                                        const BoxConstraints(maxWidth: 520),
                                    child: Text(
                                      subtitle,
                                      style: Theme.of(
                                        context,
                                      ).textTheme.bodyLarge?.copyWith(
                                            color: AppColors.muted,
                                          ),
                                    ),
                                  ),
                                  const SizedBox(height: AppSpacing.xl),
                                  formChild,
                                ],
                              ),
                            ),
                          ),
                          if (showSidePanel) ...[
                            const SizedBox(width: AppSpacing.lg),
                            Expanded(
                              flex: 4,
                              child: PremiumGradientCard(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    if ((sideEyebrow ?? '').isNotEmpty) ...[
                                      SectionEyebrow(sideEyebrow!, onDark: true),
                                      const SizedBox(height: AppSpacing.md),
                                    ],
                                    ConstrainedBox(
                                      constraints:
                                          const BoxConstraints(maxWidth: 520),
                                      child: Text(
                                        sideTitle,
                                        style: Theme.of(context)
                                            .textTheme
                                            .headlineLarge
                                            ?.copyWith(
                                              color: Colors.white,
                                              fontSize: 42,
                                            ),
                                      ),
                                    ),
                                    const SizedBox(height: AppSpacing.md),
                                    ConstrainedBox(
                                      constraints:
                                          const BoxConstraints(maxWidth: 560),
                                      child: Text(
                                        sideBody,
                                        style: Theme.of(
                                          context,
                                        ).textTheme.bodyLarge?.copyWith(
                                              color: Colors.white
                                                  .withValues(alpha: 0.8),
                                            ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
