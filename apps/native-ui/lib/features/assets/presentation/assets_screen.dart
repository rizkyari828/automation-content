import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/creatorflow_primitives.dart';

class AssetsScreen extends StatelessWidget {
  const AssetsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isId = Localizations.localeOf(context).languageCode == 'id';

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1380),
            child: Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.xl),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RevealMotion(
                    child: _AssetsHero(isId: isId),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  RevealMotion(
                    delay: const Duration(milliseconds: 90),
                    child: _LibrarySummary(isId: isId),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  RevealMotion(
                    delay: const Duration(milliseconds: 170),
                    child: _AssetGrid(isId: isId),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _AssetsHero extends StatelessWidget {
  const _AssetsHero({required this.isId});

  final bool isId;

  @override
  Widget build(BuildContext context) {
    return PremiumGradientCard(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final stacked = constraints.maxWidth < 980;
          final summary = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SectionEyebrow(
                isId ? 'Library aset' : 'Asset library',
                onDark: true,
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                isId
                    ? 'Simpan aset, preview, dan shortlist dalam satu ruang yang rapi.'
                    : 'Keep assets, previews, and shortlists inside one cleaner workspace.',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      color: Colors.white,
                      fontSize: stacked ? 38 : 48,
                    ),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                isId
                    ? 'Native library ini sudah diarahkan ke visual CreatorFlow baru, jadi grid media terasa lebih mewah dan lebih gampang discan.'
                    : 'This native library now follows the refreshed CreatorFlow direction, giving the media grid a more elevated and easier-to-scan feel.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.white.withValues(alpha: 0.82),
                    ),
              ),
            ],
          );

          final quickStats = Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: const [
              PremiumPill(label: '128 VIDEO READY'),
              PremiumPill(label: '26 CAPTION PACKS'),
              PremiumPill(label: '12 FOLDER ACTIVE'),
            ],
          );

          if (stacked) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                summary,
                const SizedBox(height: AppSpacing.lg),
                quickStats,
              ],
            );
          }

          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(flex: 6, child: summary),
              const SizedBox(width: AppSpacing.lg),
              Expanded(flex: 4, child: quickStats),
            ],
          );
        },
      ),
    );
  }
}

class _LibrarySummary extends StatelessWidget {
  const _LibrarySummary({required this.isId});

  final bool isId;

  @override
  Widget build(BuildContext context) {
    final cards = [
      (
        title: isId ? 'Folder terbaru' : 'Latest folders',
        body: isId
            ? 'Shopee Ramadan, TikTok urgency, dan affiliate testimonial ada di satu layer navigasi.'
            : 'Shopee Ramadan, TikTok urgency, and affiliate testimonial live in one cleaner navigation layer.',
        icon: Icons.folder_open_rounded,
      ),
      (
        title: isId ? 'Shortlist publish' : 'Publish shortlist',
        body: isId
            ? 'Tandai aset siap tayang tanpa pindah screen atau kehilangan konteks channel.'
            : 'Mark ready-to-publish assets without leaving the current screen or losing channel context.',
        icon: Icons.push_pin_rounded,
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final stacked = constraints.maxWidth < 980;
        final children = cards
            .map(
              (card) => PremiumSurfaceCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceMuted,
                        borderRadius: BorderRadius.circular(AppRadius.pill),
                      ),
                      child: Icon(card.icon, color: AppColors.primaryDark),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      card.title,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      card.body,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
            )
            .toList(growable: false);

        if (stacked) {
          return Column(
            children: [
              children[0],
              const SizedBox(height: AppSpacing.lg),
              children[1],
            ],
          );
        }

        return Row(
          children: [
            Expanded(child: children[0]),
            const SizedBox(width: AppSpacing.lg),
            Expanded(child: children[1]),
          ],
        );
      },
    );
  }
}

class _AssetGrid extends StatelessWidget {
  const _AssetGrid({required this.isId});

  final bool isId;

  @override
  Widget build(BuildContext context) {
    final items = [
      (
        title: 'UGC testimonial',
        note: isId ? 'Video portrait · 24 detik' : 'Portrait video · 24 sec',
        accent: AppColors.primary,
      ),
      (
        title: 'Problem-solution demo',
        note: isId ? 'Draft video · 31 detik' : 'Draft video · 31 sec',
        accent: AppColors.info,
      ),
      (
        title: 'Bundle promo cut',
        note: isId ? 'Clip publish · 18 detik' : 'Publish clip · 18 sec',
        accent: AppColors.accentWarm,
      ),
      (
        title: 'Caption pack 04',
        note: isId ? 'Copy asset · 6 varian' : 'Copy asset · 6 variants',
        accent: AppColors.success,
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 1240
            ? 4
            : constraints.maxWidth >= 900
                ? 3
                : constraints.maxWidth >= 560
                    ? 2
                    : 1;
        final cardWidth = columns == 1
            ? constraints.maxWidth
            : (constraints.maxWidth - (AppSpacing.md * (columns - 1))) /
                columns;

        return Wrap(
          spacing: AppSpacing.md,
          runSpacing: AppSpacing.md,
          children: items
              .map(
                (item) => SizedBox(
                  width: cardWidth,
                  child: PremiumSurfaceCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          height: 170,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(AppRadius.md),
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                AppColors.ink,
                                item.accent.withValues(alpha: 0.92),
                                AppColors.accentWarm.withValues(alpha: 0.82),
                              ],
                            ),
                          ),
                          alignment: Alignment.bottomLeft,
                          padding: const EdgeInsets.all(AppSpacing.md),
                          child: PremiumPill(
                            label: isId ? 'SIAP PREVIEW' : 'READY TO PREVIEW',
                            background: Colors.white,
                            foreground: AppColors.ink,
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.sm,
                              vertical: 8,
                            ),
                          ),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Text(
                          item.title,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          item.note,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ),
              )
              .toList(growable: false),
        );
      },
    );
  }
}
