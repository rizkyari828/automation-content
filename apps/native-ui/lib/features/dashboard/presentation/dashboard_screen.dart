import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import 'dashboard_controller.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardState = ref.watch(dashboardControllerProvider);
    final width = MediaQuery.sizeOf(context).width;
    final cardWidth = width >= 1200 ? 280.0 : 220.0;

    return dashboardState.when(
      data: (data) => ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          Wrap(
            spacing: AppSpacing.md,
            runSpacing: AppSpacing.md,
            children: data.metrics.map((metric) {
              return SizedBox(
                width: cardWidth,
                child: _StatCard(
                  metric.label,
                  metric.value,
                  metric.delta,
                  metric.accent,
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: AppSpacing.lg),
          _HighlightPanel(
            body: data.highlightBody,
            title: data.highlightTitle,
          ),
          const SizedBox(height: AppSpacing.lg),
          LayoutBuilder(
            builder: (context, constraints) {
              final useColumns = constraints.maxWidth >= 900;

              if (!useColumns) {
                return Column(
                  children: [
                    _CountryListCard(
                      items: data.countries,
                      title: 'Trend Watchlist',
                    ),
                    const SizedBox(height: AppSpacing.md),
                    _CategoryListCard(
                      items: data.categories,
                      title: 'Workspace Details',
                    ),
                  ],
                );
              }

              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: _CountryListCard(
                      items: data.countries,
                      title: 'Trend Watchlist',
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: _CategoryListCard(
                      items: data.categories,
                      title: 'Workspace Details',
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
      error: (error, stackTrace) => Center(
        child: Text('Unable to load dashboard: $error'),
      ),
      loading: () => const Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard(this.label, this.value, this.delta, this.accent);

  final String label;
  final String value;
  final String delta;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: AppSpacing.md),
            Text(value, style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: AppSpacing.xs),
            Text(
              '$delta from last checkpoint',
              style: TextStyle(color: accent, fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
  }
}

class _HighlightPanel extends StatelessWidget {
  const _HighlightPanel({
    required this.body,
    required this.title,
  });

  final String body;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primaryDark, AppColors.primary],
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w700,
            ),
          ),
          SizedBox(height: AppSpacing.sm),
          Text(
            body,
            style: TextStyle(color: Colors.white70),
          ),
        ],
      ),
    );
  }
}

class _CountryListCard extends StatelessWidget {
  const _CountryListCard({
    required this.items,
    required this.title,
  });

  final List<DashboardListItem> items;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: AppSpacing.md),
            if (items.isEmpty)
              const ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text('No items yet'),
                subtitle: Text('Once the API has data, it will show up here.'),
              ),
            for (final row in items)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  backgroundColor: AppColors.accent,
                  child: Icon(row.icon, color: Colors.white),
                ),
                title: Text(row.title),
                subtitle: Text(row.subtitle),
                trailing: Text(row.trailing ?? ''),
              ),
          ],
        ),
      ),
    );
  }
}

class _CategoryListCard extends StatelessWidget {
  const _CategoryListCard({
    required this.items,
    required this.title,
  });

  final List<DashboardListItem> items;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: AppSpacing.md),
            if (items.isEmpty)
              const ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text('No details yet'),
                subtitle: Text('Sign in and load workspace data first.'),
              ),
            for (final item in items)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  backgroundColor: AppColors.ink,
                  child: Icon(item.icon, color: Colors.white),
                ),
                title: Text(item.title),
                subtitle: Text(item.subtitle),
                trailing: const Icon(Icons.chevron_right_rounded),
              ),
          ],
        ),
      ),
    );
  }
}
