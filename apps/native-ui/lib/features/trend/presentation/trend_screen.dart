import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/creatorflow_primitives.dart';

class TrendScreen extends StatelessWidget {
  const TrendScreen({super.key});

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
                    child: _TrendHero(isId: isId),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  RevealMotion(
                    delay: const Duration(milliseconds: 90),
                    child: _TrendOverview(isId: isId),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  RevealMotion(
                    delay: const Duration(milliseconds: 170),
                    child: _TrendSignals(isId: isId),
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

class _TrendHero extends StatelessWidget {
  const _TrendHero({required this.isId});

  final bool isId;

  @override
  Widget build(BuildContext context) {
    final title = isId
        ? 'Pantau sinyal tren yang paling dekat ke konversi.'
        : 'Track trend signals that stay closest to conversion.';
    final body = isId
        ? 'Gunakan watchlist yang terasa ringan dibaca, tetapi cukup premium untuk dipakai tim harian saat memilih angle dan momentum publish.'
        : 'Use a watchlist that feels lighter to scan, yet premium enough for the team to use daily while picking angles and publishing momentum.';

    return PremiumGradientCard(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final stacked = constraints.maxWidth < 980;

          final summary = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SectionEyebrow(
                isId ? 'Trend intelligence' : 'Trend intelligence',
                onDark: true,
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                title,
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      color: Colors.white,
                      fontSize: stacked ? 38 : 48,
                    ),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                body,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.white.withValues(alpha: 0.82),
                    ),
              ),
            ],
          );

          final metricCard = PremiumSurfaceCard(
            color: Colors.white.withValues(alpha: 0.12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isId ? 'Sinyal naik cepat' : 'Fast-rising signals',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white,
                      ),
                ),
                const SizedBox(height: AppSpacing.md),
                const _TrendMetricRow(
                  label: 'UGC testimonial',
                  value: '+28%',
                  tone: AppColors.success,
                ),
                const _TrendMetricRow(
                  label: 'Urgency CTA',
                  value: '+18%',
                  tone: AppColors.info,
                ),
                const _TrendMetricRow(
                  label: 'Bundle offer',
                  value: '+11%',
                  tone: AppColors.accentWarm,
                ),
              ],
            ),
          );

          if (stacked) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                summary,
                const SizedBox(height: AppSpacing.lg),
                metricCard,
              ],
            );
          }

          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(flex: 6, child: summary),
              const SizedBox(width: AppSpacing.lg),
              Expanded(flex: 4, child: metricCard),
            ],
          );
        },
      ),
    );
  }
}

class _TrendOverview extends StatelessWidget {
  const _TrendOverview({required this.isId});

  final bool isId;

  @override
  Widget build(BuildContext context) {
    final items = [
      (
        title: isId ? 'Seller watchlist' : 'Seller watchlist',
        body: isId
            ? 'Kategori yang sedang naik di TikTok Shop, Shopee Video, dan short-form ads.'
            : 'Categories rising across TikTok Shop, Shopee Video, and short-form ads.',
        icon: Icons.storefront_rounded,
      ),
      (
        title: isId ? 'Angle watchlist' : 'Angle watchlist',
        body: isId
            ? 'Hook problem-solution, testimonial, dan urgency yang sedang menarik perhatian.'
            : 'Problem-solution, testimonial, and urgency hooks that are pulling more attention.',
        icon: Icons.bolt_rounded,
      ),
      (
        title: isId ? 'Creative watchlist' : 'Creative watchlist',
        body: isId
            ? 'Format video, caption style, dan CTA yang lebih mudah diadaptasi tim.'
            : 'Video formats, caption styles, and CTAs that the team can adapt more easily.',
        icon: Icons.auto_awesome_rounded,
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 1160
            ? 3
            : constraints.maxWidth >= 760
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
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(AppRadius.pill),
                            color: AppColors.surfaceMuted,
                          ),
                          child: Icon(item.icon, color: AppColors.primaryDark),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Text(
                          item.title,
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          item.body,
                          style: Theme.of(context).textTheme.bodyMedium,
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

class _TrendSignals extends StatelessWidget {
  const _TrendSignals({required this.isId});

  final bool isId;

  @override
  Widget build(BuildContext context) {
    final signals = [
      (
        title: isId
            ? 'Hook before-after tetap kuat di kategori kecantikan'
            : 'Before-after hooks stay strong in beauty',
        subtitle: isId
            ? 'CTR naik 14% untuk angle hasil yang terlihat cepat.'
            : 'CTR is up 14% for fast-visible-result angles.',
        tone: AppColors.success,
      ),
      (
        title: isId
            ? 'Bundle hemat naik di seller kebutuhan rumah'
            : 'Bundle-save angle rises in home goods',
        subtitle: isId
            ? 'Penawaran 2+1 lebih sering dipakai di creative baru.'
            : '2+1 pricing appears more often across new creatives.',
        tone: AppColors.info,
      ),
      (
        title: isId
            ? 'UGC raw testimonial mulai mengalahkan motion-heavy edit'
            : 'Raw UGC testimonial starts beating motion-heavy edits',
        subtitle: isId
            ? 'Format natural lebih terasa dipercaya dibanding visual yang terlalu polished.'
            : 'Natural formats are reading as more trustworthy than overly polished visuals.',
        tone: AppColors.accentWarm,
      ),
    ];

    return PremiumSurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isId ? 'Signal digest' : 'Signal digest',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            isId
                ? 'Susun insight penting dalam card yang nyaman dipindai di semua ukuran layar.'
                : 'Package the most important insight into cards that scan comfortably across sizes.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.lg),
          ...signals
              .map(
                (signal) => Container(
                  margin: const EdgeInsets.only(bottom: AppSpacing.md),
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: signal.tone.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(AppRadius.pill),
                        ),
                        child: Icon(
                          Icons.auto_graph_rounded,
                          color: signal.tone,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              signal.title,
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: AppSpacing.xs),
                            Text(
                              signal.subtitle,
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
        ],
      ),
    );
  }
}

class _TrendMetricRow extends StatelessWidget {
  const _TrendMetricRow({
    required this.label,
    required this.value,
    required this.tone,
  });

  final String label;
  final String value;
  final Color tone;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.white.withValues(alpha: 0.84),
                  ),
            ),
          ),
          PremiumPill(
            label: value,
            background: tone,
            foreground: Colors.white,
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.sm,
              vertical: 8,
            ),
          ),
        ],
      ),
    );
  }
}
