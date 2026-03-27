import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/router.dart';
import '../../../core/config/app_config.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/creatorflow_primitives.dart';
import 'auth_layout.dart';
import 'auth_controller.dart';
import 'social_auth_section.dart';

class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController(text: 'demo@creatorflow.app');
    _passwordController = TextEditingController(text: 'creatorflow');
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final authState = ref.watch(authControllerProvider);
    final config = ref.watch(appConfigProvider);

    ref.listen(authControllerProvider, (previous, next) {
      final session = next.maybeWhen(
        data: (session) => session,
        orElse: () => null,
      );

      if ((session?.isAuthenticated ?? false) && mounted) {
        Navigator.of(context).pushReplacementNamed(AppRouter.appShellRoute);
        return;
      }

      if (next.hasError && mounted) {
        final message = next.error.toString().replaceFirst('Bad state: ', '');
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(message)));
      }
    });

    return AuthLayout(
      title: strings.signInTitle,
      subtitle: strings.signInSubtitle(config.appName),
      sideEyebrow: 'AI content commerce OS',
      sideTitle: strings.attentionQuote,
      sideBody: strings.signInSideBody,
      formChild: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SocialAuthSection(
              busy: authState.isLoading,
              intent: 'sign_in',
              onProviderTap: (provider) {
                ref
                    .read(authControllerProvider.notifier)
                    .signInWithProvider(provider);
              },
            ),
            const SizedBox(height: AppSpacing.xl),
            TextField(
              controller: _emailController,
              decoration: InputDecoration(
                labelText: strings.email,
                hintText: strings.emailHint,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: _passwordController,
              obscureText: true,
              decoration: InputDecoration(
                labelText: strings.password,
                hintText: strings.passwordHint,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: authState.isLoading
                    ? null
                    : () {
                        ref.read(authControllerProvider.notifier).signIn(
                              email: _emailController.text,
                              password: _passwordController.text,
                            );
                      },
                child: Text(
                  authState.isLoading
                      ? strings.connecting
                      : strings.enterWorkspace,
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Wrap(
              spacing: AppSpacing.md,
              runSpacing: AppSpacing.sm,
              children: [
                TextButton(
                  onPressed: authState.isLoading
                      ? null
                      : () {
                          Navigator.of(
                            context,
                          ).pushNamed(AppRouter.forgotPasswordRoute);
                        },
                  child: Text(strings.forgotPasswordLink),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pushNamed(AppRouter.signUpRoute);
                  },
                  child: Text(strings.needAccount),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            PremiumSurfaceCard(
              padding: const EdgeInsets.all(AppSpacing.md),
              color: AppColors.surface,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    strings.authContract.toUpperCase(),
                    style: Theme.of(context).textTheme.labelMedium,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    strings.authClientInfo(
                      config.clientType,
                      config.apiBaseUrl,
                    ),
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
          ],
        ),
    );
  }
}
