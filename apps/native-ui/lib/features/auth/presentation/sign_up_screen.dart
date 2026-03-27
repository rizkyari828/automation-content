import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/router.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/theme/app_spacing.dart';
import 'auth_layout.dart';
import 'auth_controller.dart';
import 'social_auth_section.dart';

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  late final TextEditingController _fullNameController;
  late final TextEditingController _workspaceController;
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;

  @override
  void initState() {
    super.initState();
    _fullNameController = TextEditingController();
    _workspaceController = TextEditingController();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _workspaceController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final authState = ref.watch(authControllerProvider);

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
      title: strings.createWorkspaceTitle,
      subtitle: strings.createWorkspaceSubtitle,
      sideEyebrow: 'workspace onboarding',
      sideTitle: strings.createWorkspaceTitle,
      sideBody: strings.signInSideBody,
      formChild: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SocialAuthSection(
            busy: authState.isLoading,
            intent: 'register',
            onProviderTap: (provider) {
              ref
                  .read(authControllerProvider.notifier)
                  .signUpWithProvider(provider);
            },
          ),
          const SizedBox(height: AppSpacing.xl),
          TextField(
            controller: _fullNameController,
            decoration: InputDecoration(
              labelText: strings.fullName,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          TextField(
            controller: _workspaceController,
            decoration: InputDecoration(
              labelText: strings.workspaceName,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          TextField(
            controller: _emailController,
            decoration: InputDecoration(labelText: strings.email),
          ),
          const SizedBox(height: AppSpacing.md),
          TextField(
            controller: _passwordController,
            obscureText: true,
            decoration: InputDecoration(
              labelText: strings.password,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: authState.isLoading
                  ? null
                  : () {
                      ref.read(authControllerProvider.notifier).signUp(
                            email: _emailController.text,
                            fullName: _fullNameController.text,
                            password: _passwordController.text,
                            workspaceName: _workspaceController.text,
                          );
                    },
              child: Text(
                authState.isLoading
                    ? strings.creating
                    : strings.createAndContinue,
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          TextButton(
            onPressed: () {
              Navigator.of(context).pushNamed(AppRouter.signInRoute);
            },
            child: Text(strings.backToSignIn),
          ),
        ],
      ),
    );
  }
}
