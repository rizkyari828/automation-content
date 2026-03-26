import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';
import 'router.dart';

class CreatorFlowApp extends StatelessWidget {
  const CreatorFlowApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CreatorFlow Native UI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      initialRoute: AppRouter.signInRoute,
      onGenerateRoute: AppRouter.onGenerateRoute,
    );
  }
}
