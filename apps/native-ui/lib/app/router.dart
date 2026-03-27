import 'package:flutter/material.dart';

import '../core/widgets/app_shell.dart';
import '../features/auth/presentation/forgot_password_screen.dart';
import '../features/auth/presentation/sign_in_screen.dart';
import '../features/auth/presentation/sign_up_screen.dart';

class AppRouter {
  static const signInRoute = '/sign-in';
  static const signUpRoute = '/sign-up';
  static const forgotPasswordRoute = '/forgot-password';
  static const appShellRoute = '/app';

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case forgotPasswordRoute:
        return MaterialPageRoute<void>(
          builder: (_) => const ForgotPasswordScreen(),
          settings: settings,
        );
      case signUpRoute:
        return MaterialPageRoute<void>(
          builder: (_) => const SignUpScreen(),
          settings: settings,
        );
      case appShellRoute:
        return MaterialPageRoute<void>(
          builder: (_) => const AppShell(),
          settings: settings,
        );
      case signInRoute:
      default:
        return MaterialPageRoute<void>(
          builder: (_) => const SignInScreen(),
          settings: settings,
        );
    }
  }
}
