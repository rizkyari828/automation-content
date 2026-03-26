import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import '../config/app_config.dart';

class ApiException implements Exception {
  const ApiException({
    required this.message,
    required this.statusCode,
  });

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

class UserProfile {
  const UserProfile({
    required this.email,
    required this.fullName,
    required this.status,
    required this.userId,
    required this.workspaceId,
    required this.workspaceName,
    required this.workspaceRole,
  });

  final String email;
  final String? fullName;
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
  })  : _baseUrl = baseUrl,
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
      body: {
        'clientType': clientType,
        'email': email,
        'password': password,
      },
    );

    return _parseAuthTokens(payload);
  }

  Future<AuthTokens> signUp({
    required String email,
    required String password,
    required String workspaceName,
  }) async {
    final payload = await _sendJson(
      'POST',
      '/v1/auth/register',
      body: {
        'clientType': clientType,
        'email': email,
        'password': password,
        'workspaceName': workspaceName,
      },
    );

    return _parseAuthTokens(payload);
  }

  Future<AuthTokens> refresh({
    required String refreshToken,
  }) async {
    final payload = await _sendJson(
      'POST',
      '/v1/auth/refresh',
      body: {
        'clientType': clientType,
        'refreshToken': refreshToken,
      },
    );

    return _parseAuthTokens(payload);
  }

  Future<void> signOut({
    required String refreshToken,
  }) async {
    await _sendJson(
      'POST',
      '/v1/auth/logout',
      body: {
        'clientType': clientType,
        'refreshToken': refreshToken,
      },
    );
  }

  Future<UserProfile> getCurrentUser({
    required String accessToken,
  }) async {
    final payload = await _sendJson(
      'GET',
      '/v1/me',
      accessToken: accessToken,
    );

    final user = _requireMap(payload['user'], field: 'user');
    final workspace = _requireMap(payload['workspace'], field: 'workspace');

    return UserProfile(
      email: user['email'] as String? ?? '',
      fullName: user['fullName'] as String?,
      status: user['status'] as String? ?? 'active',
      userId: user['id'] as String? ?? '',
      workspaceId: workspace['id'] as String? ?? '',
      workspaceName: workspace['name'] as String? ?? '',
      workspaceRole: workspace['roleCode'] as String? ?? 'member',
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

    switch (method) {
      case 'GET':
        response = await _httpClient.get(uri, headers: headers);
      case 'POST':
        response = await _httpClient.post(
          uri,
          headers: headers,
          body: encodedBody,
        );
      default:
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

  Map<String, dynamic> _requireMap(
    Object? value, {
    required String field,
  }) {
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
