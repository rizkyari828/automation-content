import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';

import '../../../core/config/app_config.dart';
import '../../../core/networking/api_client.dart';
import '../domain/social_auth_provider.dart';

class NativeSsoService {
  const NativeSsoService({
    required this.apiClient,
    required this.config,
  });

  final ApiClient apiClient;
  final AppConfig config;

  Future<AuthTokens> authenticate({
    required String intent,
    required SocialAuthProvider provider,
  }) async {
    ensureSupportedPlatform(provider);

    final redirectUri = Uri.parse(
      '${config.nativeSsoBridgeBaseUrl}/v1/auth/oauth/${provider.code}/native-bridge',
    ).replace(
      queryParameters: {
        'nativeRedirectUri': config.nativeSsoCallbackUri.toString(),
      },
    );

    final session = await apiClient.startSso(
      intent: intent,
      provider: provider.code,
      redirectUri: redirectUri.toString(),
    );

    if (session.authorizationUrl.isEmpty) {
      throw StateError('SSO provider did not return an authorization URL');
    }

    final callbackResult = await FlutterWebAuth2.authenticate(
      url: session.authorizationUrl,
      callbackUrlScheme: config.nativeSsoCallbackScheme,
    );
    final callbackUri = Uri.parse(callbackResult);
    final error = callbackUri.queryParameters['error'];

    if ((error ?? '').isNotEmpty) {
      throw StateError(
        callbackUri.queryParameters['error_description'] ?? error!,
      );
    }

    final code = callbackUri.queryParameters['code'];
    final state = callbackUri.queryParameters['state'];

    if ((code ?? '').isEmpty || (state ?? '').isEmpty) {
      throw StateError('SSO callback is missing code or state');
    }

    return apiClient.completeSso(
      code: code!,
      oauthUser: callbackUri.queryParameters['user'],
      provider: provider.code,
      state: state!,
    );
  }

  void ensureSupportedPlatform(SocialAuthProvider provider) {
    if (kIsWeb || Platform.isLinux || Platform.isWindows) {
      throw StateError(
        'Native SSO is currently ready on Android and macOS. Windows/Linux need extra webview setup first.',
      );
    }

    if (provider == SocialAuthProvider.apple &&
        !config.nativeSsoBridgeBaseUrl.startsWith('https://')) {
      throw StateError(
        'Apple Sign In for native needs an HTTPS bridge URL. Set NATIVE_SSO_BRIDGE_BASE_URL to a public HTTPS endpoint first.',
      );
    }
  }
}

final nativeSsoServiceProvider = Provider<NativeSsoService>((ref) {
  return NativeSsoService(
    apiClient: ref.watch(apiClientProvider),
    config: ref.watch(appConfigProvider),
  );
});
