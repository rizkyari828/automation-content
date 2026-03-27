import 'package:flutter_riverpod/flutter_riverpod.dart';

class AppConfig {
  static const nativeSsoDefaultCallbackHost = 'oauth';
  static const nativeSsoDefaultCallbackPath = '/callback';
  static const nativeSsoDefaultCallbackScheme = 'creatorflownative';

  const AppConfig({
    required this.apiBaseUrl,
    required this.appName,
    required this.clientType,
    required this.nativeSsoBridgeBaseUrl,
    required this.nativeSsoCallbackHost,
    required this.nativeSsoCallbackPath,
    required this.nativeSsoCallbackScheme,
  });

  final String apiBaseUrl;
  final String appName;
  final String clientType;
  final String nativeSsoBridgeBaseUrl;
  final String nativeSsoCallbackHost;
  final String nativeSsoCallbackPath;
  final String nativeSsoCallbackScheme;

  Uri get nativeSsoCallbackUri => Uri(
        scheme: nativeSsoCallbackScheme,
        host: nativeSsoCallbackHost,
        path: nativeSsoCallbackPath,
      );

  static const current = AppConfig(
    apiBaseUrl: String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'http://localhost:4000',
    ),
    appName: 'CreatorFlow Native UI',
    clientType: 'native',
    nativeSsoBridgeBaseUrl: String.fromEnvironment(
      'NATIVE_SSO_BRIDGE_BASE_URL',
      defaultValue: 'http://localhost:4000',
    ),
    nativeSsoCallbackHost: nativeSsoDefaultCallbackHost,
    nativeSsoCallbackPath: nativeSsoDefaultCallbackPath,
    nativeSsoCallbackScheme: nativeSsoDefaultCallbackScheme,
  );
}

final appConfigProvider = Provider<AppConfig>((ref) {
  return AppConfig.current;
});
