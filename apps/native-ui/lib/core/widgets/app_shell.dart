import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/router.dart';
import '../../features/assets/presentation/assets_screen.dart';
import '../../features/auth/domain/auth_session.dart';
import '../../features/auth/presentation/auth_controller.dart';
import '../../features/billing/presentation/billing_screen.dart';
import '../../features/content/presentation/content_screen.dart';
import '../../features/dashboard/presentation/dashboard_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/trend/presentation/trend_screen.dart';
import '../localization/app_strings.dart';
import '../localization/locale_switcher.dart';
import '../theme/app_colors.dart';
import '../theme/app_radius.dart';
import '../theme/app_spacing.dart';
import 'app_shell_controller.dart';
import 'creatorflow_primitives.dart';

class AppShell extends ConsumerWidget {
  const AppShell({super.key});

  static List<_ShellDestination> _destinations(
    AppStrings strings,
    AuthSession? session,
  ) {
    final canReadContent =
        !(session?.isAuthenticated ?? false) ||
        ((session?.hasFeature('content') ?? false) &&
            (session?.hasPermission('content.read') ?? false));
    final canReadTrend =
        !(session?.isAuthenticated ?? false) ||
        ((session?.hasFeature('trend') ?? false) &&
            (session?.hasPermission('trend.read') ?? false));
    final canReadAssets =
        !(session?.isAuthenticated ?? false) ||
        ((session?.hasFeature('assets') ?? false) &&
            (session?.hasPermission('assets.read') ?? false));
    final canReadBilling =
        !(session?.isAuthenticated ?? false) ||
        ((session?.hasFeature('billing') ?? false) &&
            (session?.hasPermission('billing.read') ?? false));

    return <_ShellDestination>[
      _ShellDestination(
        strings.dashboard,
        Icons.grid_view_rounded,
        const DashboardScreen(),
      ),
      if (canReadContent)
        _ShellDestination(
          strings.content,
          Icons.layers_rounded,
          const ContentScreen(),
        ),
      if (canReadTrend)
        _ShellDestination(
          strings.trend,
          Icons.auto_graph_rounded,
          const TrendScreen(),
        ),
      if (canReadAssets)
        _ShellDestination(
          strings.assets,
          Icons.photo_library_rounded,
          const AssetsScreen(),
        ),
      if (canReadBilling)
        _ShellDestination(
          strings.billing,
          Icons.account_balance_wallet_rounded,
          const BillingScreen(),
        ),
      _ShellDestination(
        strings.profile,
        Icons.account_circle_rounded,
        const ProfileScreen(),
      ),
    ];
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final session = ref
        .watch(authControllerProvider)
        .maybeWhen(data: (session) => session, orElse: () => null);
    final destinations = _destinations(strings, session);
    final width = MediaQuery.sizeOf(context).width;
    final useFullSidebar = width >= 1260;
    final useCompactSidebar = width >= 920 && width < 1260;
    final useSidebar = useFullSidebar || useCompactSidebar;
    final selectedIndex = ref.watch(appShellIndexProvider);
    final safeSelectedIndex = destinations.isEmpty
        ? 0
        : selectedIndex.clamp(0, destinations.length - 1);

    if (selectedIndex != safeSelectedIndex && destinations.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(appShellIndexProvider.notifier).selectIndex(safeSelectedIndex);
      });
    }

    final selected = destinations[safeSelectedIndex];

    ref.listen(authControllerProvider, (previous, next) {
      final session = next.maybeWhen(
        data: (session) => session,
        orElse: () => null,
      );

      if (!(session?.isAuthenticated ?? false)) {
        Navigator.of(
          context,
        ).pushNamedAndRemoveUntil(AppRouter.signInRoute, (route) => false);
      }
    });

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: PremiumBackdrop(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: useSidebar
                ? Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (useFullSidebar)
                        SizedBox(
                          width: 292,
                          child: RevealMotion(
                            offset: const Offset(-24, 0),
                            child: _DesktopSidebar(
                              destinations: destinations,
                              selectedIndex: safeSelectedIndex,
                              onSelect: (index) {
                                ref
                                    .read(appShellIndexProvider.notifier)
                                    .selectIndex(index);
                              },
                              onBillingTap: () {
                                final billingIndex = destinations.indexWhere(
                                  (destination) =>
                                      destination.label == strings.billing,
                                );

                                if (billingIndex >= 0) {
                                  ref
                                      .read(appShellIndexProvider.notifier)
                                      .selectIndex(billingIndex);
                                }
                              },
                            ),
                          ),
                        )
                      else
                        SizedBox(
                          width: 104,
                          child: RevealMotion(
                            offset: const Offset(-20, 0),
                            child: _CompactSidebar(
                              destinations: destinations,
                              selectedIndex: safeSelectedIndex,
                              onSelect: (index) {
                                ref
                                    .read(appShellIndexProvider.notifier)
                                    .selectIndex(index);
                              },
                            ),
                          ),
                        ),
                      const SizedBox(width: AppSpacing.lg),
                      Expanded(
                        child: RevealMotion(
                          delay: const Duration(milliseconds: 100),
                          child: _ContentArea(
                            selected: selected,
                            session: session,
                            strings: strings,
                            compactHeader: useCompactSidebar,
                            onSignOut: () {
                              ref
                                  .read(authControllerProvider.notifier)
                                  .signOut();
                            },
                          ),
                        ),
                      ),
                    ],
                  )
                : _ContentArea(
                    selected: selected,
                    session: session,
                    strings: strings,
                    compact: true,
                    compactHeader: true,
                    onSignOut: () {
                      ref.read(authControllerProvider.notifier).signOut();
                    },
                  ),
          ),
        ),
      ),
      bottomNavigationBar: useSidebar
          ? null
          : SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.lg,
                  0,
                  AppSpacing.lg,
                  AppSpacing.lg,
                ),
                child: PremiumSurfaceCard(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                    vertical: 4,
                  ),
                  child: NavigationBar(
                    selectedIndex: safeSelectedIndex,
                    onDestinationSelected: (index) {
                      ref.read(appShellIndexProvider.notifier).selectIndex(index);
                    },
                    destinations: [
                      for (final destination in destinations)
                        NavigationDestination(
                          icon: Icon(destination.icon),
                          label: destination.label,
                        ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }
}

class _ShellDestination {
  const _ShellDestination(this.label, this.icon, this.screen);

  final String label;
  final IconData icon;
  final Widget screen;
}

class _DesktopSidebar extends StatelessWidget {
  const _DesktopSidebar({
    required this.destinations,
    required this.selectedIndex,
    required this.onSelect,
    required this.onBillingTap,
  });

  final List<_ShellDestination> destinations;
  final int selectedIndex;
  final ValueChanged<int> onSelect;
  final VoidCallback onBillingTap;

  @override
  Widget build(BuildContext context) {
    return PremiumSurfaceCard(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.lg,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const CreatorFlowMark(compact: true),
          const SizedBox(height: AppSpacing.xl),
          Expanded(
            child: ListView.separated(
              padding: EdgeInsets.zero,
              itemBuilder: (context, index) {
                final destination = destinations[index];
                return _SidebarNavButton(
                  active: index == selectedIndex,
                  icon: destination.icon,
                  label: destination.label,
                  onTap: () => onSelect(index),
                );
              },
              separatorBuilder: (_, index) =>
                  const SizedBox(height: AppSpacing.xs),
              itemCount: destinations.length,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          PremiumGradientCard(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionEyebrow('CreatorFlow Pro', onDark: true),
                const SizedBox(height: AppSpacing.md),
                Text(
                  'Rapikan output tim tanpa pindah-pindah tool.',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        color: Colors.white,
                      ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Pantau workflow, billing, dan kualitas output dari satu shell native yang sama.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.78),
                      ),
                ),
                const SizedBox(height: AppSpacing.lg),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: onBillingTap,
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.ink,
                    ),
                    child: const Text('Lihat paket workspace'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CompactSidebar extends StatelessWidget {
  const _CompactSidebar({
    required this.destinations,
    required this.selectedIndex,
    required this.onSelect,
  });

  final List<_ShellDestination> destinations;
  final int selectedIndex;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    return PremiumSurfaceCard(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.lg,
      ),
      child: Column(
        children: [
          const CreatorFlowMark(compact: true, iconOnly: true),
          const SizedBox(height: AppSpacing.xl),
          Expanded(
            child: ListView.separated(
              padding: EdgeInsets.zero,
              itemCount: destinations.length,
              separatorBuilder: (_, index) =>
                  const SizedBox(height: AppSpacing.sm),
              itemBuilder: (context, index) {
                final destination = destinations[index];
                final active = index == selectedIndex;

                return Tooltip(
                  message: destination.label,
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      onTap: () => onSelect(index),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        curve: Curves.easeOut,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: active
                              ? const Color(0xFFF3F7FB)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        child: Icon(
                          destination.icon,
                          size: 22,
                          color: active
                              ? AppColors.primaryDark
                              : AppColors.mutedStrong,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _SidebarNavButton extends StatelessWidget {
  const _SidebarNavButton({
    required this.active,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final bool active;
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOut,
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: 12,
          ),
          decoration: BoxDecoration(
            color: active ? const Color(0xFFF3F7FB) : Colors.transparent,
            borderRadius: BorderRadius.circular(AppRadius.md),
            boxShadow: active
                ? [
                    BoxShadow(
                      color: AppColors.ink.withValues(alpha: 0.08),
                      blurRadius: 22,
                      offset: const Offset(0, 12),
                    ),
                  ]
                : null,
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppRadius.pill),
                  color: active ? null : AppColors.surfaceMuted,
                  gradient: active
                      ? const LinearGradient(
                          colors: [
                            AppColors.ink,
                            AppColors.primary,
                            AppColors.accentWarm,
                          ],
                        )
                      : null,
                ),
                child: Icon(
                  icon,
                  color: active ? Colors.white : AppColors.mutedStrong,
                  size: 20,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Text(
                  label,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontSize: 18,
                        color: AppColors.mutedStrong,
                      ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ContentArea extends StatelessWidget {
  const _ContentArea({
    required this.selected,
    required this.session,
    required this.strings,
    required this.onSignOut,
    this.compact = false,
    this.compactHeader = false,
  });

  final _ShellDestination selected;
  final AuthSession? session;
  final AppStrings strings;
  final VoidCallback onSignOut;
  final bool compact;
  final bool compactHeader;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        PremiumGradientCard(
          padding: EdgeInsets.symmetric(
            horizontal: compact ? AppSpacing.lg : AppSpacing.xl,
            vertical: compact ? AppSpacing.lg : AppSpacing.xl,
          ),
          child: compact || compactHeader
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _HeaderSummary(selected: selected, session: session),
                    const SizedBox(height: AppSpacing.md),
                    _HeaderActions(
                      onSignOut: onSignOut,
                      compact: true,
                      strings: strings,
                    ),
                  ],
                )
              : Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: _HeaderSummary(selected: selected, session: session),
                    ),
                    const SizedBox(width: AppSpacing.lg),
                    _HeaderActions(
                      onSignOut: onSignOut,
                      strings: strings,
                    ),
                  ],
                ),
        ),
        const SizedBox(height: AppSpacing.lg),
        Expanded(
          child: selected.screen,
        ),
      ],
    );
  }
}

class _HeaderSummary extends StatelessWidget {
  const _HeaderSummary({
    required this.selected,
    required this.session,
  });

  final _ShellDestination selected;
  final AuthSession? session;

  @override
  Widget build(BuildContext context) {
    final isId = Localizations.localeOf(context).languageCode == 'id';
    final workspaceLabel = isId ? 'WORKSPACE' : 'WORKSPACE';
    final outputLabel = isId ? 'OUTPUT MINGGU INI' : 'OUTPUT THIS WEEK';
    final outputValue = isId ? '148 draft' : '148 drafts';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionEyebrow(workspaceLabel, onDark: true),
        const SizedBox(height: AppSpacing.sm),
        Text(
          selected.label,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: Colors.white,
                fontSize: 30,
              ),
        ),
        const SizedBox(height: AppSpacing.md),
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: [
            PremiumPill(
              label:
                  '$workspaceLabel: ${(session?.workspaceName ?? 'CreatorFlow Studio').toUpperCase()}',
            ),
            PremiumPill(
              label: '$outputLabel: ${outputValue.toUpperCase()}',
              background: AppColors.darkCard.withValues(alpha: 0.82),
              foreground: Colors.white,
            ),
          ],
        ),
      ],
    );
  }
}

class _HeaderActions extends StatelessWidget {
  const _HeaderActions({
    required this.onSignOut,
    required this.strings,
    this.compact = false,
  });

  final VoidCallback onSignOut;
  final AppStrings strings;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.sm,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        const LocaleSwitcher(compact: true),
        if (!compact)
          FilledButton.tonal(
            onPressed: () {},
            style: FilledButton.styleFrom(
              backgroundColor: Colors.white.withValues(alpha: 0.12),
              foregroundColor: Colors.white,
            ),
            child: Text(strings.previewMode),
          ),
        OutlinedButton.icon(
          onPressed: onSignOut,
          style: OutlinedButton.styleFrom(
            foregroundColor: Colors.white,
            side: BorderSide(
              color: Colors.white.withValues(alpha: 0.22),
            ),
            backgroundColor: Colors.white.withValues(alpha: 0.06),
          ),
          icon: const Icon(Icons.logout_rounded),
          label: Text(strings.signOut),
        ),
      ],
    );
  }
}
