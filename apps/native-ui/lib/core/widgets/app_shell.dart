import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/router.dart';
import '../../features/assets/presentation/assets_screen.dart';
import '../../features/auth/presentation/auth_controller.dart';
import '../../features/billing/presentation/billing_screen.dart';
import '../../features/content/presentation/content_screen.dart';
import '../../features/dashboard/presentation/dashboard_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/trend/presentation/trend_screen.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import 'app_shell_controller.dart';

class AppShell extends ConsumerWidget {
  const AppShell({super.key});

  static const _destinations = <_ShellDestination>[
    _ShellDestination('Dashboard', Icons.dashboard_rounded, DashboardScreen()),
    _ShellDestination('Content', Icons.edit_note_rounded, ContentScreen()),
    _ShellDestination('Trend', Icons.auto_graph_rounded, TrendScreen()),
    _ShellDestination('Assets', Icons.perm_media_rounded, AssetsScreen()),
    _ShellDestination('Billing', Icons.credit_card_rounded, BillingScreen()),
    _ShellDestination('Profile', Icons.account_circle_rounded, ProfileScreen()),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final width = MediaQuery.sizeOf(context).width;
    final useRail = width >= 900;
    final selectedIndex = ref.watch(appShellIndexProvider);
    final session = ref.watch(authControllerProvider).maybeWhen(
          data: (session) => session,
          orElse: () => null,
        );
    final selected = _destinations[selectedIndex];

    ref.listen(authControllerProvider, (previous, next) {
      final session = next.maybeWhen(
        data: (session) => session,
        orElse: () => null,
      );

      if (!(session?.isAuthenticated ?? false)) {
        Navigator.of(context).pushNamedAndRemoveUntil(
          AppRouter.signInRoute,
          (route) => false,
        );
      }
    });

    return Scaffold(
      body: SafeArea(
        child: Row(
          children: [
            if (useRail)
              NavigationRail(
                extended: width >= 1200,
                selectedIndex: selectedIndex,
                onDestinationSelected: (index) {
                  ref.read(appShellIndexProvider.notifier).selectIndex(index);
                },
                destinations: [
                  for (final destination in _destinations)
                    NavigationRailDestination(
                      icon: Icon(destination.icon),
                      label: Text(destination.label),
                    ),
                ],
                leading: Padding(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Column(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          'C',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      const Text(
                        'CreatorFlow',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ),
              ),
            Expanded(
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(
                      AppSpacing.lg,
                      AppSpacing.lg,
                      AppSpacing.lg,
                      AppSpacing.md,
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                selected.label,
                                style:
                                    Theme.of(context).textTheme.headlineMedium,
                              ),
                              const SizedBox(height: AppSpacing.xs),
                              const Text(
                                'Native shell aligned with the current web dashboard.',
                                style: TextStyle(color: AppColors.muted),
                              ),
                              if (session?.isAuthenticated ?? false)
                                Text(
                                  'Signed in as ${session!.email}',
                                  style: const TextStyle(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            FilledButton.tonal(
                              onPressed: () {},
                              child: const Text('Preview Mode'),
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            IconButton(
                              onPressed: () {
                                ref
                                    .read(authControllerProvider.notifier)
                                    .signOut();
                              },
                              tooltip: 'Sign out',
                              icon: const Icon(Icons.logout_rounded),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1),
                  Expanded(
                    child: Container(
                      color: AppColors.surface,
                      width: double.infinity,
                      child: selected.screen,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: useRail
          ? null
          : NavigationBar(
              selectedIndex: selectedIndex,
              onDestinationSelected: (index) {
                ref.read(appShellIndexProvider.notifier).selectIndex(index);
              },
              destinations: [
                for (final destination in _destinations)
                  NavigationDestination(
                    icon: Icon(destination.icon),
                    label: destination.label,
                  ),
              ],
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
