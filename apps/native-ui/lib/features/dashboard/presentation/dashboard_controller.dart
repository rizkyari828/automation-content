import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/localization/app_locale_controller.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/networking/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/presentation/auth_controller.dart';

class DashboardMetric {
  const DashboardMetric({
    required this.accent,
    required this.delta,
    required this.label,
    required this.value,
  });

  final Color accent;
  final String delta;
  final String label;
  final String value;
}

class DashboardListItem {
  const DashboardListItem({
    required this.icon,
    required this.subtitle,
    required this.title,
    this.trailing,
  });

  final IconData icon;
  final String subtitle;
  final String title;
  final String? trailing;
}

class DashboardState {
  const DashboardState({
    required this.categories,
    required this.countries,
    required this.highlightBody,
    required this.highlightTitle,
    required this.metrics,
  });

  final List<DashboardListItem> categories;
  final List<DashboardListItem> countries;
  final String highlightBody;
  final String highlightTitle;
  final List<DashboardMetric> metrics;
}

class DashboardController extends AsyncNotifier<DashboardState> {
  @override
  Future<DashboardState> build() async {
    final apiClient = ref.watch(apiClientProvider);
    final language = ref.watch(appLocaleProvider).maybeWhen(
          data: (language) => language,
          orElse: () => AppLanguage.english,
        );
    final strings = AppStrings.fromLanguageCode(language.code);
    final session = await ref.watch(authControllerProvider.future);

    if (!session.isAuthenticated || session.accessToken == null) {
      return DashboardState(
        categories: const [],
        countries: const [],
        highlightBody: strings.signInToLoadWorkspace,
        highlightTitle: strings.welcomeCreatorFlow,
        metrics: const [],
      );
    }

    final watchlist = await apiClient.getTrendWatchlist(
      accessToken: session.accessToken!,
    );
    final latestDigest = await apiClient.getLatestTrendDigest(
      accessToken: session.accessToken!,
    );

    return DashboardState(
      metrics: [
        DashboardMetric(
          accent: AppColors.primary,
          delta: session.workspaceRole ?? strings.member,
          label: strings.workspaceMetric,
          value: session.workspaceName ?? '-',
        ),
        DashboardMetric(
          accent: AppColors.success,
          delta: strings.activeRecommendations,
          label: strings.watchlistItems,
          value: '${watchlist.length}',
        ),
        DashboardMetric(
          accent: AppColors.warning,
          delta: latestDigest?.period ?? strings.notReadyYet,
          label: strings.latestDigest,
          value: '${latestDigest?.items.length ?? 0}',
        ),
        DashboardMetric(
          accent: AppColors.accent,
          delta: session.status ?? strings.connected,
          label: strings.clientType,
          value: session.clientType.toUpperCase(),
        ),
      ],
      countries: watchlist
          .take(4)
          .map(
            (item) => DashboardListItem(
              icon: Icons.trending_up_rounded,
              subtitle: item.signalType,
              title: item.title,
              trailing: item.score.toStringAsFixed(1),
            ),
          )
          .toList(growable: false),
      categories: [
        DashboardListItem(
          icon: Icons.account_circle_rounded,
          subtitle: session.workspaceRole ?? strings.member,
          title: session.email ?? '-',
        ),
        DashboardListItem(
          icon: Icons.badge_rounded,
          subtitle: session.status ?? strings.active,
          title: session.fullName ?? strings.profileIncomplete,
        ),
        DashboardListItem(
          icon: Icons.folder_shared_rounded,
          subtitle: session.workspaceId ?? '-',
          title: session.workspaceName ?? '-',
        ),
        DashboardListItem(
          icon: Icons.api_rounded,
          subtitle: session.apiBaseUrl,
          title: strings.nativeAuthReady,
        ),
      ],
      highlightBody: latestDigest?.summary ?? strings.noDigestYet,
      highlightTitle: strings.workspaceOverview(
        session.workspaceName ?? strings.overview,
      ),
    );
  }
}

final dashboardControllerProvider =
    AsyncNotifierProvider<DashboardController, DashboardState>(
  DashboardController.new,
);
