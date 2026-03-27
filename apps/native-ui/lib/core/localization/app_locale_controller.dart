import 'dart:ui';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/token_storage.dart';

enum AppLanguage {
  english('en'),
  indonesian('id');

  const AppLanguage(this.code);

  final String code;

  Locale get locale => Locale(code);

  static AppLanguage fromCode(String? code) {
    switch ((code ?? '').toLowerCase()) {
      case 'id':
        return AppLanguage.indonesian;
      case 'en':
      default:
        return AppLanguage.english;
    }
  }
}

class AppLocaleController extends AsyncNotifier<AppLanguage> {
  static const _storageKey = 'creatorflow_app_language';

  @override
  Future<AppLanguage> build() async {
    final storage = ref.watch(secureStorageProvider);
    final storedLanguage = await storage.read(key: _storageKey);

    if ((storedLanguage ?? '').isNotEmpty) {
      return AppLanguage.fromCode(storedLanguage);
    }

    return AppLanguage.fromCode(
        PlatformDispatcher.instance.locale.languageCode);
  }

  Future<void> setLanguage(AppLanguage language) async {
    state = AsyncData(language);
    final storage = ref.read(secureStorageProvider);
    await storage.write(key: _storageKey, value: language.code);
  }
}

final appLocaleProvider =
    AsyncNotifierProvider<AppLocaleController, AppLanguage>(
  AppLocaleController.new,
);
