class AuthSession {
  const AuthSession({
    required this.accessToken,
    required this.apiBaseUrl,
    required this.clientType,
    required this.email,
    required this.enabledFeatureCodes,
    required this.fullName,
    required this.isAuthenticated,
    required this.permissions,
    required this.platformRoleCode,
    required this.refreshToken,
    required this.status,
    required this.userId,
    required this.workspaceId,
    required this.workspaceName,
    required this.workspaceRole,
  });

  final String? accessToken;
  final String apiBaseUrl;
  final String clientType;
  final String? email;
  final List<String> enabledFeatureCodes;
  final String? fullName;
  final bool isAuthenticated;
  final List<String> permissions;
  final String? platformRoleCode;
  final String? refreshToken;
  final String? status;
  final String? userId;
  final String? workspaceId;
  final String? workspaceName;
  final String? workspaceRole;

  factory AuthSession.signedOut({
    required String apiBaseUrl,
    required String clientType,
  }) {
    return AuthSession(
      accessToken: null,
      apiBaseUrl: apiBaseUrl,
      clientType: clientType,
      email: null,
      enabledFeatureCodes: const <String>[],
      fullName: null,
      isAuthenticated: false,
      permissions: const <String>[],
      platformRoleCode: null,
      refreshToken: null,
      status: null,
      userId: null,
      workspaceId: null,
      workspaceName: null,
      workspaceRole: null,
    );
  }

  factory AuthSession.authenticated({
    required String accessToken,
    required String apiBaseUrl,
    required String clientType,
    required String refreshToken,
    required String workspaceId,
    required String workspaceName,
    required String workspaceRole,
    required String userId,
    required String email,
    required String status,
    List<String> enabledFeatureCodes = const <String>[],
    String? fullName,
    List<String> permissions = const <String>[],
    String? platformRoleCode,
  }) {
    return AuthSession(
      accessToken: accessToken,
      apiBaseUrl: apiBaseUrl,
      clientType: clientType,
      email: email,
      enabledFeatureCodes: enabledFeatureCodes,
      fullName: fullName,
      isAuthenticated: true,
      permissions: permissions,
      platformRoleCode: platformRoleCode,
      refreshToken: refreshToken,
      status: status,
      userId: userId,
      workspaceId: workspaceId,
      workspaceName: workspaceName,
      workspaceRole: workspaceRole,
    );
  }

  bool hasFeature(String code) {
    if (platformRoleCode == 'superadmin') {
      return true;
    }

    return enabledFeatureCodes.contains(code);
  }

  bool hasPermission(String code) {
    if (platformRoleCode == 'superadmin') {
      return true;
    }

    return permissions.contains(code);
  }
}
