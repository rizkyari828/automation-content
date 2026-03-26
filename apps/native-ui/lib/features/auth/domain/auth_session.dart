class AuthSession {
  const AuthSession({
    required this.accessToken,
    required this.apiBaseUrl,
    required this.clientType,
    required this.email,
    required this.fullName,
    required this.isAuthenticated,
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
  final String? fullName;
  final bool isAuthenticated;
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
      fullName: null,
      isAuthenticated: false,
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
    String? fullName,
  }) {
    return AuthSession(
      accessToken: accessToken,
      apiBaseUrl: apiBaseUrl,
      clientType: clientType,
      email: email,
      fullName: fullName,
      isAuthenticated: true,
      refreshToken: refreshToken,
      status: status,
      userId: userId,
      workspaceId: workspaceId,
      workspaceName: workspaceName,
      workspaceRole: workspaceRole,
    );
  }
}
