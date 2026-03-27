import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/router.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/networking/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import 'auth_layout.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  late final TextEditingController _emailController;
  late final TextEditingController _codeController;
  late final TextEditingController _passwordController;

  bool _submitting = false;
  bool _showResetStep = false;
  String? _error;
  String? _notice;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController();
    _codeController = TextEditingController();
    _passwordController = TextEditingController();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _codeController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _requestCode() async {
    setState(() {
      _submitting = true;
      _error = null;
      _notice = null;
    });

    try {
      await ref
          .read(apiClientProvider)
          .requestPasswordResetCode(email: _emailController.text.trim());

      if (!mounted) {
        return;
      }

      setState(() {
        _showResetStep = true;
        _notice = AppStrings.of(context).resetCodeSent;
      });
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _error = error.message;
      });
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  Future<void> _resetPassword() async {
    setState(() {
      _submitting = true;
      _error = null;
      _notice = null;
    });

    try {
      await ref
          .read(apiClientProvider)
          .resetPassword(
            code: _codeController.text.trim(),
            email: _emailController.text.trim(),
            newPassword: _passwordController.text,
          );

      if (!mounted) {
        return;
      }

      setState(() {
        _notice = AppStrings.of(context).passwordResetSuccess;
      });

      await Future<void>.delayed(const Duration(milliseconds: 900));

      if (mounted) {
        Navigator.of(
          context,
        ).pushNamedAndRemoveUntil(AppRouter.signInRoute, (route) => false);
      }
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _error = error.message;
      });
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    return AuthLayout(
      title: strings.forgotPasswordTitle,
      subtitle: strings.forgotPasswordSubtitle,
      sideEyebrow: 'account recovery',
      sideTitle: strings.forgotPasswordSideTitle,
      sideBody: strings.forgotPasswordSideBody,
      formChild: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: _emailController,
            decoration: InputDecoration(
              labelText: strings.email,
              hintText: strings.emailHint,
            ),
          ),
          if (_showResetStep) ...[
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: _codeController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: strings.otpCode,
                hintText: strings.otpCodeHint,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: _passwordController,
              obscureText: true,
              decoration: InputDecoration(
                labelText: strings.newPassword,
                hintText: strings.newPasswordHint,
              ),
            ),
          ],
          if ((_notice ?? '').isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            Text(
              _notice!,
              style: const TextStyle(
                color: AppColors.success,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
          if ((_error ?? '').isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            Text(
              _error!,
              style: const TextStyle(
                color: AppColors.danger,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.lg),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _submitting
                  ? null
                  : _showResetStep
                      ? _resetPassword
                      : _requestCode,
              child: Text(
                _showResetStep
                    ? (_submitting
                        ? strings.resettingPassword
                        : strings.resetPassword)
                    : (_submitting
                        ? strings.requestingResetCode
                        : strings.requestResetCode),
              ),
            ),
          ),
          if (_showResetStep) ...[
            const SizedBox(height: AppSpacing.sm),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: _submitting
                    ? null
                    : () {
                        setState(() {
                          _showResetStep = false;
                          _error = null;
                          _notice = null;
                        });
                      },
                child: Text(strings.requestAnotherCode),
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          TextButton(
            onPressed: _submitting
                ? null
                : () {
                    Navigator.of(context).pop();
                  },
            child: Text(strings.backToSignIn),
          ),
        ],
      ),
    );
  }
}
