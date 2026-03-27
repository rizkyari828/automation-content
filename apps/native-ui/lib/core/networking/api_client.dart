import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import '../config/app_config.dart';

class ApiException implements Exception {
  const ApiException({required this.message, required this.statusCode});

  final String message;
  final int statusCode;

  @override
  String toString() => message;
}

class AuthTokens {
  const AuthTokens({
    required this.accessToken,
    required this.clientType,
    required this.expiresIn,
    required this.refreshToken,
    required this.userId,
    required this.workspaceId,
  });

  final String accessToken;
  final String clientType;
  final String expiresIn;
  final String refreshToken;
  final String userId;
  final String workspaceId;
}

class OAuthStartSession {
  const OAuthStartSession({
    required this.authorizationUrl,
    required this.provider,
  });

  final String authorizationUrl;
  final String provider;
}

class AuthorizationFeatureState {
  const AuthorizationFeatureState({required this.code, required this.enabled});

  final String code;
  final bool enabled;
}

class AuthorizationSummary {
  const AuthorizationSummary({
    required this.enabledFeatureCodes,
    required this.features,
    required this.permissions,
    required this.platformRoleCode,
    required this.workspaceRoleCode,
  });

  final List<String> enabledFeatureCodes;
  final List<AuthorizationFeatureState> features;
  final List<String> permissions;
  final String? platformRoleCode;
  final String workspaceRoleCode;
}

class WorkspaceFeatureDetail {
  const WorkspaceFeatureDetail({
    required this.code,
    required this.configuredByEmail,
    required this.configuredByUserId,
    required this.enabled,
    required this.updatedAt,
  });

  final String code;
  final String? configuredByEmail;
  final String? configuredByUserId;
  final bool enabled;
  final String? updatedAt;
}

class WorkspaceMember {
  const WorkspaceMember({
    required this.email,
    required this.fullName,
    required this.id,
    required this.joinedAt,
    required this.roleCode,
    required this.status,
    required this.userId,
  });

  final String email;
  final String? fullName;
  final String id;
  final String? joinedAt;
  final String roleCode;
  final String status;
  final String userId;
}

class UserProfile {
  const UserProfile({
    required this.aboutText,
    required this.authorization,
    required this.email,
    required this.emailVerifiedAt,
    required this.fullName,
    required this.lastLoginAt,
    required this.status,
    required this.userId,
    required this.workspaceId,
    required this.workspaceName,
    required this.workspaceRole,
  });

  final String? aboutText;
  final AuthorizationSummary authorization;
  final String email;
  final String? emailVerifiedAt;
  final String? fullName;
  final String? lastLoginAt;
  final String status;
  final String userId;
  final String workspaceId;
  final String workspaceName;
  final String workspaceRole;
}

class ConnectedAuthProvider {
  const ConnectedAuthProvider({
    required this.avatarUrl,
    required this.connectedAt,
    required this.email,
    required this.lastLoginAt,
    required this.provider,
    required this.username,
  });

  final String? avatarUrl;
  final String? connectedAt;
  final String? email;
  final String? lastLoginAt;
  final String provider;
  final String? username;
}

class AccountProfile {
  const AccountProfile({
    required this.aboutText,
    required this.authorization,
    required this.email,
    required this.emailVerified,
    required this.emailVerifiedAt,
    required this.fullName,
    required this.lastLoginAt,
    required this.providers,
    required this.status,
    required this.userId,
    required this.workspaceId,
    required this.workspaceName,
    required this.workspaceRole,
  });

  final String? aboutText;
  final AuthorizationSummary authorization;
  final String email;
  final bool emailVerified;
  final String? emailVerifiedAt;
  final String? fullName;
  final String? lastLoginAt;
  final List<ConnectedAuthProvider> providers;
  final String status;
  final String userId;
  final String workspaceId;
  final String workspaceName;
  final String workspaceRole;
}

class TrendWatchlistItem {
  const TrendWatchlistItem({
    required this.period,
    required this.recommendationText,
    required this.score,
    required this.signalType,
    required this.title,
  });

  final String period;
  final String recommendationText;
  final double score;
  final String signalType;
  final String title;
}

class TrendDigest {
  const TrendDigest({
    required this.items,
    required this.period,
    required this.summary,
  });

  final List<TrendWatchlistItem> items;
  final String period;
  final String summary;
}

class ApiClient {
  const ApiClient({
    required String baseUrl,
    required this.clientType,
    required http.Client httpClient,
  }) : _baseUrl = baseUrl,
       _httpClient = httpClient;

  final String clientType;
  final String _baseUrl;
  final http.Client _httpClient;

  String get baseUrl => _baseUrl;

  Future<AuthTokens> signIn({
    required String email,
    required String password,
  }) async {
    final payload = await _sendJson(
      'POST',
      '/v1/auth/login',
      body: {'clientType': clientType, 'email': email, 'password': password},
    );

    return _parseAuthTokens(payload);
  }

  Future<AuthTokens> signUp({
    required String email,
    String? fullName,
    required String password,
    required String workspaceName,
  }) async {
    final payload = await _sendJson(
      'POST',
      '/v1/auth/register',
      body: {
        'clientType': clientType,
        'email': email,
        if ((fullName ?? '').trim().isNotEmpty) 'fullName': fullName!.trim(),
        'password': password,
        'workspaceName': workspaceName,
      },
    );

    return _parseAuthTokens(payload);
  }

  Future<OAuthStartSession> startSso({
    required String intent,
    required String provider,
    required String redirectUri,
  }) async {
    final uri = Uri.parse(
      '$_baseUrl/v1/auth/oauth/$provider/start',
    ).replace(queryParameters: {'intent': intent, 'redirectUri': redirectUri});

    final response = await _httpClient.get(
      uri,
      headers: {'accept': 'application/json', 'x-client-type': clientType},
    );
    final payload = _decodeJson(response.body);

    if (response.statusCode >= 400) {
      throw ApiException(
        message: _extractMessage(payload) ?? 'Unable to start SSO',
        statusCode: response.statusCode,
      );
    }

    return OAuthStartSession(
      authorizationUrl: payload['authorizationUrl'] as String? ?? '',
      provider: payload['provider'] as String? ?? provider,
    );
  }

  Future<AuthTokens> completeSso({
    required String code,
    String? oauthUser,
    required String provider,
    required String state,
  }) async {
    final payload = await _sendJson(
      'POST',
      '/v1/auth/oauth/$provider/callback',
      body: {
        'clientType': clientType,
        'code': code,
        if ((oauthUser ?? '').isNotEmpty) 'oauthUser': oauthUser,
        'state': state,
      },
    );

    return _parseAuthTokens(payload);
  }

  Future<AuthTokens> refresh({required String refreshToken}) async {
    final payload = await _sendJson(
      'POST',
      '/v1/auth/refresh',
      body: {'clientType': clientType, 'refreshToken': refreshToken},
    );

    return _parseAuthTokens(payload);
  }

  Future<void> signOut({required String refreshToken}) async {
    await _sendJson(
      'POST',
      '/v1/auth/logout',
      body: {'clientType': clientType, 'refreshToken': refreshToken},
    );
  }

  Future<UserProfile> getCurrentUser({required String accessToken}) async {
    final payload = await _sendJson('GET', '/v1/me', accessToken: accessToken);

    final user = _requireMap(payload['user'], field: 'user');
    final workspace = _requireMap(payload['workspace'], field: 'workspace');
    final authorization = _parseAuthorization(
      payload['authorization'],
      fallbackWorkspaceRoleCode: workspace['roleCode'] as String? ?? 'member',
    );

    return UserProfile(
      aboutText: user['aboutText'] as String?,
      authorization: authorization,
      email: user['email'] as String? ?? '',
      emailVerifiedAt: user['emailVerifiedAt'] as String?,
      fullName: user['fullName'] as String?,
      lastLoginAt: user['lastLoginAt'] as String?,
      status: user['status'] as String? ?? 'active',
      userId: user['id'] as String? ?? '',
      workspaceId: workspace['id'] as String? ?? '',
      workspaceName: workspace['name'] as String? ?? '',
      workspaceRole: workspace['roleCode'] as String? ?? 'member',
    );
  }

  Future<void> requestEmailVerificationCode({
    required String accessToken,
  }) async {
    await _sendJson(
      'POST',
      '/v1/auth/email-verification/request',
      accessToken: accessToken,
    );
  }

  Future<void> verifyEmailCode({
    required String accessToken,
    required String code,
  }) async {
    await _sendJson(
      'POST',
      '/v1/auth/email-verification/verify',
      accessToken: accessToken,
      body: {'code': code},
    );
  }

  Future<void> requestPasswordResetCode({required String email}) async {
    await _sendJson(
      'POST',
      '/v1/auth/forgot-password/request',
      body: {'email': email},
    );
  }

  Future<void> resetPassword({
    required String code,
    required String email,
    required String newPassword,
  }) async {
    await _sendJson(
      'POST',
      '/v1/auth/forgot-password/reset',
      body: {'code': code, 'email': email, 'newPassword': newPassword},
    );
  }

  Future<AccountProfile> getProfile({required String accessToken}) async {
    final payload = await _sendJson(
      'GET',
      '/v1/profile',
      accessToken: accessToken,
    );

    return _parseAccountProfile(payload);
  }

  Future<AccountProfile> updateProfile({
    required String accessToken,
    required String aboutText,
    required String fullName,
    required String workspaceName,
  }) async {
    final payload = await _sendJson(
      'PATCH',
      '/v1/profile',
      accessToken: accessToken,
      body: {
        'aboutText': aboutText,
        'fullName': fullName,
        'workspaceName': workspaceName,
      },
    );

    return _parseAccountProfile(payload);
  }

  Future<List<WorkspaceMember>> getWorkspaceMembers({
    required String accessToken,
  }) async {
    final payload = await _sendJson(
      'GET',
      '/v1/workspace/members',
      accessToken: accessToken,
    );

    final items = payload['items'];
    if (items is! List) {
      return const <WorkspaceMember>[];
    }

    return items
        .whereType<Map<String, dynamic>>()
        .map(
          (item) => WorkspaceMember(
            email: item['email'] as String? ?? '',
            fullName: item['fullName'] as String?,
            id: item['id'] as String? ?? '',
            joinedAt: item['joinedAt'] as String?,
            roleCode: item['roleCode'] as String? ?? 'viewer',
            status: item['status'] as String? ?? 'active',
            userId: item['userId'] as String? ?? '',
          ),
        )
        .toList(growable: false);
  }

  Future<WorkspaceMember> updateWorkspaceMemberRole({
    required String accessToken,
    required String membershipId,
    required String roleCode,
  }) async {
    final payload = await _sendJson(
      'PATCH',
      '/v1/workspace/members/$membershipId',
      accessToken: accessToken,
      body: {'roleCode': roleCode},
    );

    final item = _requireMap(payload['item'], field: 'item');
    return WorkspaceMember(
      email: item['email'] as String? ?? '',
      fullName: item['fullName'] as String?,
      id: item['id'] as String? ?? '',
      joinedAt: item['joinedAt'] as String?,
      roleCode: item['roleCode'] as String? ?? roleCode,
      status: item['status'] as String? ?? 'active',
      userId: item['userId'] as String? ?? '',
    );
  }

  Future<List<WorkspaceFeatureDetail>> getWorkspaceFeatures({
    required String accessToken,
  }) async {
    final payload = await _sendJson(
      'GET',
      '/v1/workspace/features',
      accessToken: accessToken,
    );

    final items = payload['items'];
    if (items is! List) {
      return const <WorkspaceFeatureDetail>[];
    }

    return items
        .whereType<Map<String, dynamic>>()
        .map(
          (item) => WorkspaceFeatureDetail(
            code: item['code'] as String? ?? '',
            configuredByEmail: item['configuredByEmail'] as String?,
            configuredByUserId: item['configuredByUserId'] as String?,
            enabled: item['enabled'] as bool? ?? false,
            updatedAt: item['updatedAt'] as String?,
          ),
        )
        .toList(growable: false);
  }

  Future<WorkspaceFeatureDetail> updateWorkspaceFeature({
    required String accessToken,
    required String code,
    required bool enabled,
  }) async {
    final payload = await _sendJson(
      'PATCH',
      '/v1/workspace/features/$code',
      accessToken: accessToken,
      body: {'enabled': enabled},
    );

    final item = _requireMap(payload['item'], field: 'item');
    return WorkspaceFeatureDetail(
      code: item['code'] as String? ?? code,
      configuredByEmail: item['configuredByEmail'] as String?,
      configuredByUserId: item['configuredByUserId'] as String?,
      enabled: item['enabled'] as bool? ?? enabled,
      updatedAt: item['updatedAt'] as String?,
    );
  }

  Future<List<TrendWatchlistItem>> getTrendWatchlist({
    required String accessToken,
  }) async {
    final payload = await _sendJson(
      'GET',
      '/v1/trend/watchlist',
      accessToken: accessToken,
    );

    final items = payload['items'];
    if (items is! List) {
      return const [];
    }

    return items
        .whereType<Map<String, dynamic>>()
        .map(
          (item) => TrendWatchlistItem(
            period: item['period'] as String? ?? 'daily',
            recommendationText: item['recommendationText'] as String? ?? '',
            score: (item['score'] as num?)?.toDouble() ?? 0,
            signalType: item['signalType'] as String? ?? 'topic',
            title: item['title'] as String? ?? '',
          ),
        )
        .toList(growable: false);
  }

  Future<TrendDigest?> getLatestTrendDigest({
    required String accessToken,
  }) async {
    try {
      final payload = await _sendJson(
        'GET',
        '/v1/trend/digests/latest',
        accessToken: accessToken,
      );

      final items = payload['items'];
      final digestItems = items is List
          ? items
                .whereType<Map<String, dynamic>>()
                .map(
                  (item) => TrendWatchlistItem(
                    period: item['period'] as String? ?? 'daily',
                    recommendationText:
                        item['recommendationText'] as String? ?? '',
                    score: (item['score'] as num?)?.toDouble() ?? 0,
                    signalType: item['signalType'] as String? ?? 'topic',
                    title: item['title'] as String? ?? '',
                  ),
                )
                .toList(growable: false)
          : const <TrendWatchlistItem>[];

      return TrendDigest(
        items: digestItems,
        period: payload['period'] as String? ?? 'daily',
        summary: payload['summary'] as String? ?? '',
      );
    } on ApiException catch (error) {
      if (error.statusCode == 404) {
        return null;
      }

      rethrow;
    }
  }

  Future<Map<String, dynamic>> _sendJson(
    String method,
    String path, {
    String? accessToken,
    Map<String, dynamic>? body,
  }) async {
    final headers = <String, String>{
      'accept': 'application/json',
      if (body != null) 'content-type': 'application/json',
      if (accessToken != null) 'authorization': 'Bearer $accessToken',
      'x-client-type': clientType,
    };

    late final http.Response response;
    final uri = Uri.parse('$_baseUrl$path');
    final encodedBody = body == null ? null : jsonEncode(body);

    if (method == 'GET') {
      response = await _httpClient.get(uri, headers: headers);
    } else if (method == 'POST') {
      response = await _httpClient.post(
        uri,
        headers: headers,
        body: encodedBody,
      );
    } else if (method == 'PATCH') {
      response = await _httpClient.patch(
        uri,
        headers: headers,
        body: encodedBody,
      );
    } else {
      throw UnsupportedError('Unsupported method: $method');
    }

    final payload = _decodeJson(response.body);

    if (response.statusCode >= 400) {
      throw ApiException(
        message: _extractMessage(payload) ?? 'Request failed',
        statusCode: response.statusCode,
      );
    }

    return payload;
  }

  Map<String, dynamic> _decodeJson(String body) {
    if (body.isEmpty) {
      return <String, dynamic>{};
    }

    final decoded = jsonDecode(body);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }

    return <String, dynamic>{};
  }

  String? _extractMessage(Map<String, dynamic> payload) {
    final message = payload['message'];
    final error = payload['error'];

    if (message is String && message.isNotEmpty) {
      return message;
    }

    if (error is String && error.isNotEmpty) {
      return error;
    }

    return null;
  }

  Map<String, dynamic> _requireMap(Object? value, {required String field}) {
    if (value is Map<String, dynamic>) {
      return value;
    }

    throw ApiException(
      message: 'Unexpected payload for $field',
      statusCode: 500,
    );
  }

  AuthTokens _parseAuthTokens(Map<String, dynamic> payload) {
    final accessToken = payload['accessToken'] as String?;
    final refreshToken = payload['refreshToken'] as String?;

    if (accessToken == null || refreshToken == null) {
      throw const ApiException(
        message: 'Auth payload is missing native tokens',
        statusCode: 500,
      );
    }

    return AuthTokens(
      accessToken: accessToken,
      clientType: payload['clientType'] as String? ?? clientType,
      expiresIn: payload['expiresIn'] as String? ?? '15m',
      refreshToken: refreshToken,
      userId: payload['userId'] as String? ?? '',
      workspaceId: payload['workspaceId'] as String? ?? '',
    );
  }

  AccountProfile _parseAccountProfile(Map<String, dynamic> payload) {
    final user = _requireMap(payload['user'], field: 'user');
    final workspace = _requireMap(payload['workspace'], field: 'workspace');
    final security = _requireMap(payload['security'], field: 'security');
    final authorization = _parseAuthorization(
      payload['authorization'],
      fallbackWorkspaceRoleCode: workspace['roleCode'] as String? ?? 'member',
    );
    final providersValue = payload['providers'];
    final providers = providersValue is List
        ? providersValue
              .whereType<Map<String, dynamic>>()
              .map(
                (provider) => ConnectedAuthProvider(
                  avatarUrl: provider['avatarUrl'] as String?,
                  connectedAt: provider['connectedAt'] as String?,
                  email: provider['email'] as String?,
                  lastLoginAt: provider['lastLoginAt'] as String?,
                  provider: provider['provider'] as String? ?? 'unknown',
                  username: provider['username'] as String?,
                ),
              )
              .toList(growable: false)
        : const <ConnectedAuthProvider>[];

    return AccountProfile(
      aboutText: user['aboutText'] as String?,
      authorization: authorization,
      email: user['email'] as String? ?? '',
      emailVerified: security['emailVerified'] as bool? ?? false,
      emailVerifiedAt: security['emailVerifiedAt'] as String?,
      fullName: user['fullName'] as String?,
      lastLoginAt: security['lastLoginAt'] as String?,
      providers: providers,
      status: user['status'] as String? ?? 'active',
      userId: user['id'] as String? ?? '',
      workspaceId: workspace['id'] as String? ?? '',
      workspaceName: workspace['name'] as String? ?? '',
      workspaceRole: workspace['roleCode'] as String? ?? 'member',
    );
  }

  AuthorizationSummary _parseAuthorization(
    Object? value, {
    required String fallbackWorkspaceRoleCode,
  }) {
    if (value is! Map<String, dynamic>) {
      return AuthorizationSummary(
        enabledFeatureCodes: const <String>[],
        features: const <AuthorizationFeatureState>[],
        permissions: const <String>[],
        platformRoleCode: null,
        workspaceRoleCode: fallbackWorkspaceRoleCode,
      );
    }

    final featuresValue = value['features'];
    final features = featuresValue is List
        ? featuresValue
              .whereType<Map<String, dynamic>>()
              .map(
                (feature) => AuthorizationFeatureState(
                  code: feature['code'] as String? ?? '',
                  enabled: feature['enabled'] as bool? ?? false,
                ),
              )
              .toList(growable: false)
        : const <AuthorizationFeatureState>[];

    final enabledFeatureCodes = value['enabledFeatureCodes'] is List
        ? (value['enabledFeatureCodes'] as List).whereType<String>().toList(
            growable: false,
          )
        : features
              .where((feature) => feature.enabled)
              .map((feature) => feature.code)
              .toList(growable: false);

    final permissions = value['permissions'] is List
        ? (value['permissions'] as List).whereType<String>().toList(
            growable: false,
          )
        : const <String>[];

    return AuthorizationSummary(
      enabledFeatureCodes: enabledFeatureCodes,
      features: features,
      permissions: permissions,
      platformRoleCode: value['platformRoleCode'] as String?,
      workspaceRoleCode:
          value['workspaceRoleCode'] as String? ?? fallbackWorkspaceRoleCode,
    );
  }
}

final httpClientProvider = Provider<http.Client>((ref) {
  final client = http.Client();
  ref.onDispose(client.close);
  return client;
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final config = ref.watch(appConfigProvider);
  final httpClient = ref.watch(httpClientProvider);

  return ApiClient(
    baseUrl: config.apiBaseUrl,
    clientType: config.clientType,
    httpClient: httpClient,
  );
});
