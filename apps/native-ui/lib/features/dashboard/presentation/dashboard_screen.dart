import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/localization/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/creatorflow_primitives.dart';
import 'dashboard_controller.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardState = ref.watch(dashboardControllerProvider);

    return dashboardState.when(
      data: (data) => ListView(
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
                    _HeroPanel(data: data),
                    const SizedBox(height: AppSpacing.lg),
                    _MetricGrid(metrics: data.metrics),
                    const SizedBox(height: AppSpacing.lg),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final useSplit = constraints.maxWidth >= 980;

                        if (!useSplit) {
                          return Column(
                            children: [
                              _MomentumCard(metrics: data.metrics),
                              const SizedBox(height: AppSpacing.lg),
                              _WorkflowCard(items: data.categories),
                            ],
                          );
                        }

                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              flex: 7,
                              child: _MomentumCard(metrics: data.metrics),
                            ),
                            const SizedBox(width: AppSpacing.lg),
                            Expanded(
                              flex: 4,
                              child: _WorkflowCard(items: data.categories),
                            ),
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final useSplit = constraints.maxWidth >= 980;

                        if (!useSplit) {
                          return Column(
                            children: [
                              _SignalListCard(
                                title: Localizations.localeOf(context)
                                            .languageCode ==
                                        'id'
                                    ? 'Watchlist tren'
                                    : 'Trend watchlist',
                                items: data.countries,
                              ),
                              const SizedBox(height: AppSpacing.lg),
                              _SignalListCard(
                                title: Localizations.localeOf(context)
                                            .languageCode ==
                                        'id'
                                    ? 'Detail workspace'
                                    : 'Workspace details',
                                items: data.categories,
                              ),
                            ],
                          );
                        }

                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: _SignalListCard(
                                title: Localizations.localeOf(context)
                                            .languageCode ==
                                        'id'
                                    ? 'Watchlist tren'
                                    : 'Trend watchlist',
                                items: data.countries,
                              ),
                            ),
                            const SizedBox(width: AppSpacing.lg),
                            Expanded(
                              child: _SignalListCard(
                                title: Localizations.localeOf(context)
                                            .languageCode ==
                                        'id'
                                    ? 'Detail workspace'
                                    : 'Workspace details',
                                items: data.categories,
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      error: (error, stackTrace) => Center(
        child: Text(AppStrings.of(context).unableToLoadDashboard(error)),
      ),
      loading: () => const Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}

class _HeroPanel extends StatelessWidget {
  const _HeroPanel({required this.data});

  final DashboardState data;

  @override
  Widget build(BuildContext context) {
    final isId = Localizations.localeOf(context).languageCode == 'id';
    final title = isId
        ? 'Dari brief jadi output yang siap gerak lebih cepat.'
        : 'Move from brief to ready-to-publish output faster.';
    final body = isId
        ? 'Shell native ini mengikuti bahasa visual CreatorFlow baru, jadi tim tetap dapat dashboard yang terasa premium, fokus, dan siap dipakai kerja.'
        : 'This native shell now follows the refreshed CreatorFlow visual language, with a premium dashboard that stays focused and execution-ready.';

    return PremiumGradientCard(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final stacked = constraints.maxWidth < 980;
          final titleFontSize = constraints.maxWidth < 560
              ? 34.0
              : constraints.maxWidth < 980
                  ? 40.0
                  : 48.0;

          if (stacked) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionEyebrow('Workspace pulse', onDark: true),
                const SizedBox(height: AppSpacing.md),
                Text(
                  title,
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                        color: Colors.white,
                        fontSize: titleFontSize,
                      ),
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  body,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: Colors.white.withValues(alpha: 0.8),
                      ),
                ),
                const SizedBox(height: AppSpacing.lg),
                Wrap(
                  spacing: AppSpacing.sm,
                  runSpacing: AppSpacing.sm,
                  children: data.metrics
                      .take(3)
                      .map(
                        (metric) => PremiumPill(
                          label: '${metric.value} ${metric.label}'.toUpperCase(),
                          background: Colors.white,
                          foreground: AppColors.ink,
                        ),
                      )
                      .toList(growable: false),
                ),
              ],
            );
          }

          return Row(
            children: [
              Expanded(
                flex: 6,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SectionEyebrow('Workspace pulse', onDark: true),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      title,
                      style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                            color: Colors.white,
                            fontSize: titleFontSize,
                          ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      body,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: Colors.white.withValues(alpha: 0.8),
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.lg),
              Expanded(
                flex: 4,
                child: Column(
                  children: data.metrics
                      .take(3)
                      .map(
                        (metric) => Padding(
                          padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                          child: PremiumPill(
                            label:
                                '${metric.value} ${metric.label}'.toUpperCase(),
                            background: Colors.white,
                            foreground: AppColors.ink,
                          ),
                        ),
                      )
                      .toList(growable: false),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _MetricGrid extends StatelessWidget {
  const _MetricGrid({required this.metrics});

  final List<DashboardMetric> metrics;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final maxWidth = constraints.maxWidth;
        final columns = maxWidth >= 1240
            ? 4
            : maxWidth >= 760
                ? 2
                : 1;
        final cardWidth = columns == 1
            ? maxWidth
            : (maxWidth - (AppSpacing.md * (columns - 1))) / columns;

        return Wrap(
          spacing: AppSpacing.md,
          runSpacing: AppSpacing.md,
          children: metrics.map((metric) {
            final compactCard = cardWidth < 230;

            return SizedBox(
              width: cardWidth,
              child: PremiumSurfaceCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            metric.label.toUpperCase(),
                            style: Theme.of(context).textTheme.labelMedium,
                          ),
                        ),
                        Container(
                          width: compactCard ? 46 : 52,
                          height: compactCard ? 46 : 52,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(
                              colors: [
                                metric.accent.withValues(alpha: 0.95),
                                metric.accent.withValues(alpha: 0.74),
                              ],
                            ),
                          ),
                          child: const Icon(
                            Icons.auto_awesome_rounded,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      metric.value,
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      metric.delta,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: metric.accent,
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(growable: false),
        );
      },
    );
  }
}

class _MomentumCard extends StatelessWidget {
  const _MomentumCard({required this.metrics});

  final List<DashboardMetric> metrics;

  @override
  Widget build(BuildContext context) {
    final isId = Localizations.localeOf(context).languageCode == 'id';

    return PremiumSurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isId ? 'Kecepatan produksi konten' : 'Content production velocity',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            isId
                ? 'Ritme output mingguan yang lebih stabil dan lebih mudah dipantau.'
                : 'A steadier weekly output rhythm with cleaner visibility.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.lg),
          Container(
            height: 280,
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(color: AppColors.border),
            ),
            child: CustomPaint(
              painter: _LineChartPainter(
                lineColor: AppColors.info,
              ),
              child: const SizedBox.expand(),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: metrics
                .map(
                  (metric) => PremiumPill(
                    label: '${metric.label}: ${metric.value}',
                    background: AppColors.surfaceMuted,
                    foreground: AppColors.mutedStrong,
                  ),
                )
                .toList(growable: false),
          ),
        ],
      ),
    );
  }
}

class _WorkflowCard extends StatelessWidget {
  const _WorkflowCard({required this.items});

  final List<DashboardListItem> items;

  @override
  Widget build(BuildContext context) {
    final isId = Localizations.localeOf(context).languageCode == 'id';

    return PremiumSurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isId ? 'Snapshot workflow' : 'Workflow snapshot',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: AppSpacing.sm),
          ...items.take(4).map(
                (item) => Container(
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
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppColors.surfaceMuted,
                          borderRadius: BorderRadius.circular(AppRadius.pill),
                        ),
                        child: Icon(
                          item.icon,
                          size: 20,
                          color: AppColors.primaryDark,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.title,
                              style: Theme.of(context).textTheme.titleSmall,
                            ),
                            const SizedBox(height: AppSpacing.xs),
                            Text(
                              item.subtitle,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      PremiumPill(
                        label: item.trailing ?? (isId ? 'aktif' : 'active'),
                        background: AppColors.primary.withValues(alpha: 0.12),
                        foreground: AppColors.primaryDark,
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

class _SignalListCard extends StatelessWidget {
  const _SignalListCard({
    required this.items,
    required this.title,
  });

  final List<DashboardListItem> items;
  final String title;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return PremiumSurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: AppSpacing.md),
          if (items.isEmpty)
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(strings.noItemsYet),
              subtitle: Text(strings.noItemsBody),
            ),
          for (final row in items)
            Container(
              margin: const EdgeInsets.only(bottom: AppSpacing.md),
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppRadius.md),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: AppColors.surfaceMuted,
                    child: Icon(row.icon, color: AppColors.ink),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          row.title,
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          row.subtitle,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  if ((row.trailing ?? '').isNotEmpty)
                    PremiumPill(
                      label: row.trailing!,
                      background: AppColors.darkCard,
                      foreground: Colors.white,
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _LineChartPainter extends CustomPainter {
  const _LineChartPainter({required this.lineColor});

  final Color lineColor;

  @override
  void paint(Canvas canvas, Size size) {
    final gridPaint = Paint()
      ..color = AppColors.border
      ..strokeWidth = 1;

    for (var i = 1; i < 5; i++) {
      final y = size.height * i / 5;
      canvas.drawLine(Offset(20, y), Offset(size.width - 20, y), gridPaint);
    }

    final fillPath = Path();
    final linePath = Path();
    final points = <Offset>[];
    final values = [0.78, 0.62, 0.7, 0.42, 0.56, 0.36, 0.28];

    for (var i = 0; i < values.length; i++) {
      final x = 20 + ((size.width - 40) / (values.length - 1)) * i;
      final y = size.height * values[i];
      points.add(Offset(x, y));
    }

    linePath.moveTo(points.first.dx, points.first.dy);
    for (var i = 0; i < points.length - 1; i++) {
      final p1 = points[i];
      final p2 = points[i + 1];
      final controlX = (p1.dx + p2.dx) / 2;
      linePath.cubicTo(controlX, p1.dy, controlX, p2.dy, p2.dx, p2.dy);
    }

    fillPath.addPath(linePath, Offset.zero);
    fillPath.lineTo(points.last.dx, size.height - 18);
    fillPath.lineTo(points.first.dx, size.height - 18);
    fillPath.close();

    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          lineColor.withValues(alpha: 0.24),
          lineColor.withValues(alpha: 0.03),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    final linePaint = Paint()
      ..color = lineColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round;

    canvas.drawPath(fillPath, fillPaint);
    canvas.drawPath(linePath, linePaint);

    final dotPaint = Paint()..color = lineColor;
    for (final point in points) {
      canvas.drawCircle(point, 4.5, dotPaint);
      canvas.drawCircle(
        point,
        9,
        Paint()..color = lineColor.withValues(alpha: 0.12),
      );
    }

    final labelStyle = TextStyle(
      color: AppColors.muted,
      fontSize: 12,
    );
    const labels = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

    for (var i = 0; i < labels.length; i++) {
      final tp = TextPainter(
        text: TextSpan(text: labels[i], style: labelStyle),
        textDirection: TextDirection.ltr,
      )..layout();
      final x = 20 + ((size.width - 40) / (labels.length - 1)) * i;
      tp.paint(canvas, Offset(x - (tp.width / 2), size.height - 16));
    }
  }

  @override
  bool shouldRepaint(covariant _LineChartPainter oldDelegate) {
    return oldDelegate.lineColor != lineColor;
  }
}
