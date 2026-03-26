import 'package:flutter_riverpod/flutter_riverpod.dart';

class AppConfig {
  const AppConfig({
    required this.apiBaseUrl,
    required this.appName,
    required this.clientType,
  });

  final String apiBaseUrl;
  final String appName;
  final String clientType;

  static const current = AppConfig(
    apiBaseUrl: String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'http://localhost:4000',
    ),
    appName: 'CreatorFlow Native UI',
    clientType: 'native',
  );
}

final appConfigProvider = Provider<AppConfig>((ref) {
  return AppConfig.current;
});
