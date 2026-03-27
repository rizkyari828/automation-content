import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/networking/api_client.dart';
import '../../../core/storage/token_storage.dart';
import '../domain/auth_session.dart';
import '../domain/social_auth_provider.dart';
import 'native_sso_service.dart';

class AuthController extends AsyncNotifier<AuthSession> {
  @override
  Future<AuthSession> build() async {
    final apiClient = ref.watch(apiClientProvider);
    final tokenStorage = ref.watch(tokenStorageProvider);
    final storedTokens = await tokenStorage.read();

    if ((storedTokens.refreshToken ?? '').isEmpty) {
      return AuthSession.signedOut(
        apiBaseUrl: apiClient.baseUrl,
        clientType: apiClient.clientType,
      );
    }

    final refreshToken = storedTokens.refreshToken!;
    final storedAccessToken = storedTokens.accessToken;

    if ((storedAccessToken ?? '').isNotEmpty) {
      try {
        final profile = await apiClient.getCurrentUser(
          accessToken: storedAccessToken!,
        );

        return AuthSession.authenticated(
          accessToken: storedAccessToken,
          apiBaseUrl: apiClient.baseUrl,
          clientType: apiClient.clientType,
          email: profile.email,
          enabledFeatureCodes: profile.authorization.enabledFeatureCodes,
          fullName: profile.fullName,
          permissions: profile.authorization.permissions,
          platformRoleCode: profile.authorization.platformRoleCode,
          refreshToken: refreshToken,
          status: profile.status,
          userId: profile.userId,
          workspaceId: profile.workspaceId,
          workspaceName: profile.workspaceName,
          workspaceRole: profile.workspaceRole,
        );
      } on ApiException catch (error) {
        if (error.statusCode != 401) {
          rethrow;
        }
      }
    }

    try {
      final refreshedTokens = await apiClient.refresh(
        refreshToken: refreshToken,
      );
      final profile = await apiClient.getCurrentUser(
        accessToken: refreshedTokens.accessToken,
      );

      await tokenStorage.write(
        accessToken: refreshedTokens.accessToken,
        refreshToken: refreshedTokens.refreshToken,
      );

      return AuthSession.authenticated(
        accessToken: refreshedTokens.accessToken,
        apiBaseUrl: apiClient.baseUrl,
        clientType: apiClient.clientType,
        email: profile.email,
        enabledFeatureCodes: profile.authorization.enabledFeatureCodes,
        fullName: profile.fullName,
        permissions: profile.authorization.permissions,
        platformRoleCode: profile.authorization.platformRoleCode,
        refreshToken: refreshedTokens.refreshToken,
        status: profile.status,
        userId: profile.userId,
        workspaceId: profile.workspaceId,
        workspaceName: profile.workspaceName,
        workspaceRole: profile.workspaceRole,
      );
    } on ApiException catch (error) {
      if (error.statusCode == 401) {
        await tokenStorage.clear();
        return AuthSession.signedOut(
          apiBaseUrl: apiClient.baseUrl,
          clientType: apiClient.clientType,
        );
      }

      rethrow;
    }
  }

  Future<void> signIn({required String email, required String password}) async {
    if (email.trim().isEmpty || password.isEmpty) {
      state = AsyncError(
        StateError('Email and password are required'),
        StackTrace.current,
      );
      return;
    }

    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final apiClient = ref.read(apiClientProvider);
      final tokenStorage = ref.read(tokenStorageProvider);
      final tokens = await apiClient.signIn(
        email: email.trim(),
        password: password,
      );
      final profile = await apiClient.getCurrentUser(
        accessToken: tokens.accessToken,
      );

      await tokenStorage.write(
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      );

      return AuthSession.authenticated(
        accessToken: tokens.accessToken,
        apiBaseUrl: apiClient.baseUrl,
        clientType: apiClient.clientType,
        email: profile.email,
        enabledFeatureCodes: profile.authorization.enabledFeatureCodes,
        fullName: profile.fullName,
        permissions: profile.authorization.permissions,
        platformRoleCode: profile.authorization.platformRoleCode,
        refreshToken: tokens.refreshToken,
        status: profile.status,
        userId: profile.userId,
        workspaceId: profile.workspaceId,
        workspaceName: profile.workspaceName,
        workspaceRole: profile.workspaceRole,
      );
    });
  }

  Future<void> signUp({
    required String email,
    String? fullName,
    required String password,
    required String workspaceName,
  }) async {
    if (email.trim().isEmpty ||
        password.isEmpty ||
        workspaceName.trim().isEmpty) {
      state = AsyncError(
        StateError('Workspace name, email, and password are required'),
        StackTrace.current,
      );
      return;
    }

    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final apiClient = ref.read(apiClientProvider);
      final tokenStorage = ref.read(tokenStorageProvider);
      final tokens = await apiClient.signUp(
        email: email.trim(),
        fullName: fullName?.trim(),
        password: password,
        workspaceName: workspaceName.trim(),
      );
      final profile = await apiClient.getCurrentUser(
        accessToken: tokens.accessToken,
      );

      await tokenStorage.write(
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      );

      return AuthSession.authenticated(
        accessToken: tokens.accessToken,
        apiBaseUrl: apiClient.baseUrl,
        clientType: apiClient.clientType,
        email: profile.email,
        enabledFeatureCodes: profile.authorization.enabledFeatureCodes,
        fullName: profile.fullName,
        permissions: profile.authorization.permissions,
        platformRoleCode: profile.authorization.platformRoleCode,
        refreshToken: tokens.refreshToken,
        status: profile.status,
        userId: profile.userId,
        workspaceId: profile.workspaceId,
        workspaceName: profile.workspaceName,
        workspaceRole: profile.workspaceRole,
      );
    });
  }

  Future<void> signOut() async {
    final apiClient = ref.read(apiClientProvider);
    final tokenStorage = ref.read(tokenStorageProvider);
    final storedTokens = await tokenStorage.read();

    if ((storedTokens.refreshToken ?? '').isNotEmpty) {
      try {
        await apiClient.signOut(refreshToken: storedTokens.refreshToken!);
      } on ApiException {
        // Clear local session even if remote logout fails.
      }
    }

    await tokenStorage.clear();

    state = AsyncData(
      AuthSession.signedOut(
        apiBaseUrl: apiClient.baseUrl,
        clientType: apiClient.clientType,
      ),
    );
  }

  Future<void> signInWithProvider(SocialAuthProvider provider) async {
    await _authenticateWithProvider(intent: 'sign_in', provider: provider);
  }

  Future<void> signUpWithProvider(SocialAuthProvider provider) async {
    await _authenticateWithProvider(intent: 'register', provider: provider);
  }

  Future<void> _authenticateWithProvider({
    required String intent,
    required SocialAuthProvider provider,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final apiClient = ref.read(apiClientProvider);
      final tokenStorage = ref.read(tokenStorageProvider);
      final ssoService = ref.read(nativeSsoServiceProvider);
      final tokens = await ssoService.authenticate(
        intent: intent,
        provider: provider,
      );
      final profile = await apiClient.getCurrentUser(
        accessToken: tokens.accessToken,
      );

      await tokenStorage.write(
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      );

      return AuthSession.authenticated(
        accessToken: tokens.accessToken,
        apiBaseUrl: apiClient.baseUrl,
        clientType: apiClient.clientType,
        email: profile.email,
        enabledFeatureCodes: profile.authorization.enabledFeatureCodes,
        fullName: profile.fullName,
        permissions: profile.authorization.permissions,
        platformRoleCode: profile.authorization.platformRoleCode,
        refreshToken: tokens.refreshToken,
        status: profile.status,
        userId: profile.userId,
        workspaceId: profile.workspaceId,
        workspaceName: profile.workspaceName,
        workspaceRole: profile.workspaceRole,
      );
    });
  }
}

final authControllerProvider =
    AsyncNotifierProvider<AuthController, AuthSession>(AuthController.new);
