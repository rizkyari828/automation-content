import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/localization/app_locale_controller.dart';
import '../core/localization/app_strings.dart';
import '../core/theme/app_theme.dart';
import 'router.dart';

class CreatorFlowApp extends ConsumerWidget {
  const CreatorFlowApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final language = ref.watch(appLocaleProvider).maybeWhen(
          data: (language) => language,
          orElse: () => AppLanguage.english,
        );
    final strings = AppStrings.fromLanguageCode(language.code);

    return MaterialApp(
      title: strings.appTitle,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      locale: language.locale,
      supportedLocales: const [
        Locale('en'),
        Locale('id'),
      ],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      initialRoute: AppRouter.signInRoute,
      onGenerateRoute: AppRouter.onGenerateRoute,
    );
  }
}
