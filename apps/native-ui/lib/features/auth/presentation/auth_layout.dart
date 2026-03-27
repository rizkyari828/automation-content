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
    final showSidePanel = width >= 1180;
    final showStackedShowcase = width >= 760 && width < 1180;
    final horizontalPadding = width < 640
        ? AppSpacing.md
        : width < 960
            ? AppSpacing.lg
            : AppSpacing.xl;
    final cardPadding = width < 640 ? AppSpacing.lg : AppSpacing.xl;

    return Scaffold(
      body: PremiumBackdrop(
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                padding: EdgeInsets.all(horizontalPadding),
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    minHeight: constraints.maxHeight - (horizontalPadding * 2),
                  ),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 1360),
                      child: showSidePanel
                          ? Row(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Expanded(
                                  flex: 5,
                                  child: PremiumSurfaceCard(
                                    padding: EdgeInsets.all(cardPadding),
                                    child: _AuthFormPanel(
                                      title: title,
                                      subtitle: subtitle,
                                      formChild: formChild,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: AppSpacing.lg),
                                Expanded(
                                  flex: 4,
                                  child: PremiumGradientCard(
                                    child: _AuthShowcase(
                                      sideEyebrow: sideEyebrow,
                                      sideTitle: sideTitle,
                                      sideBody: sideBody,
                                    ),
                                  ),
                                ),
                              ],
                            )
                          : Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                if (showStackedShowcase)
                                  Padding(
                                    padding: const EdgeInsets.only(
                                      bottom: AppSpacing.lg,
                                    ),
                                    child: PremiumGradientCard(
                                      padding: const EdgeInsets.all(
                                        AppSpacing.lg,
                                      ),
                                      child: _AuthShowcase(
                                        sideEyebrow: sideEyebrow,
                                        sideTitle: sideTitle,
                                        sideBody: sideBody,
                                        compact: true,
                                      ),
                                    ),
                                  ),
                                PremiumSurfaceCard(
                                  padding: EdgeInsets.all(cardPadding),
                                  child: _AuthFormPanel(
                                    title: title,
                                    subtitle: subtitle,
                                    formChild: formChild,
                                  ),
                                ),
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

class _AuthFormPanel extends StatelessWidget {
  const _AuthFormPanel({
    required this.title,
    required this.subtitle,
    required this.formChild,
  });

  final String title;
  final String subtitle;
  final Widget formChild;

  @override
  Widget build(BuildContext context) {
    return Column(
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
          style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                fontSize: MediaQuery.sizeOf(context).width < 640 ? 34 : null,
              ),
        ),
        const SizedBox(height: AppSpacing.sm),
        ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.muted,
                ),
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        formChild,
      ],
    );
  }
}

class _AuthShowcase extends StatelessWidget {
  const _AuthShowcase({
    required this.sideEyebrow,
    required this.sideTitle,
    required this.sideBody,
    this.compact = false,
  });

  final String? sideEyebrow;
  final String sideTitle;
  final String sideBody;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: compact
          ? MainAxisAlignment.start
          : MainAxisAlignment.end,
      children: [
        if ((sideEyebrow ?? '').isNotEmpty) ...[
          SectionEyebrow(sideEyebrow!, onDark: true),
          const SizedBox(height: AppSpacing.md),
        ],
        ConstrainedBox(
          constraints: BoxConstraints(maxWidth: compact ? 620 : 520),
          child: Text(
            sideTitle,
            style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  color: Colors.white,
                  fontSize: compact ? 34 : 42,
                ),
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        ConstrainedBox(
          constraints: BoxConstraints(maxWidth: compact ? 640 : 560),
          child: Text(
            sideBody,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Colors.white.withValues(alpha: 0.8),
                ),
          ),
        ),
      ],
    );
  }
}
