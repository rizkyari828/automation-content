import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/networking/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../auth/presentation/auth_controller.dart';
import '../../../core/localization/app_strings.dart';

const _workspaceRoleOptions = <String>['owner', 'admin', 'editor', 'viewer'];

const _featureLabels = <String, String>{
  'assets': 'Asset library',
  'billing': 'Billing',
  'content': 'Content generation',
  'media': 'Media rendering',
  'publishing': 'Publishing',
  'sso': 'Single sign-on',
  'team': 'Team management',
  'trend': 'Trend intelligence',
  'workspace_settings': 'Workspace settings',
};

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  late final TextEditingController _fullNameController;
  late final TextEditingController _workspaceNameController;
  late final TextEditingController _aboutController;
  late final TextEditingController _verificationCodeController;

  AccountProfile? _profile;
  List<WorkspaceFeatureDetail> _workspaceFeatures = const [];
  List<WorkspaceMember> _workspaceMembers = const [];
  String? _loadedAccessToken;
  String? _accessError;
  String? _error;
  String? _featureUpdatingCode;
  String? _memberUpdatingId;
  String? _notice;
  bool _loadingAccess = false;
  bool _loading = false;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _fullNameController = TextEditingController();
    _workspaceNameController = TextEditingController();
    _aboutController = TextEditingController();
    _verificationCodeController = TextEditingController();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _workspaceNameController.dispose();
    _aboutController.dispose();
    _verificationCodeController.dispose();
    super.dispose();
  }

  Future<void> _loadProfile(String accessToken) async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final profile = await ref
          .read(apiClientProvider)
          .getProfile(accessToken: accessToken);

      if (!mounted) {
        return;
      }

      _loadedAccessToken = accessToken;
      _fullNameController.text = profile.fullName ?? '';
      _workspaceNameController.text = profile.workspaceName;
      _aboutController.text = profile.aboutText ?? '';

      setState(() {
        _profile = profile;
      });
      await _loadWorkspaceAccess(accessToken, profile.authorization);
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _error = error.message;
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _loadWorkspaceAccess(
    String accessToken,
    AuthorizationSummary authorization,
  ) async {
    final canManageMembers =
        authorization.permissions.contains('members.manage') &&
        authorization.enabledFeatureCodes.contains('team');
    final canViewWorkspace =
        authorization.permissions.contains('workspace.view') ||
        authorization.platformRoleCode == 'superadmin';

    if (!canManageMembers && !canViewWorkspace) {
      if (!mounted) {
        return;
      }

      setState(() {
        _workspaceFeatures = authorization.features
            .map(
              (feature) => WorkspaceFeatureDetail(
                code: feature.code,
                configuredByEmail: null,
                configuredByUserId: null,
                enabled: feature.enabled,
                updatedAt: null,
              ),
            )
            .toList(growable: false);
        _workspaceMembers = const <WorkspaceMember>[];
        _accessError = null;
      });
      return;
    }

    setState(() {
      _loadingAccess = true;
      _accessError = null;
    });

    try {
      final futures = <Future<Object?>>[
        if (canManageMembers)
          ref.read(apiClientProvider).getWorkspaceMembers(accessToken: accessToken),
        if (canViewWorkspace)
          ref.read(apiClientProvider).getWorkspaceFeatures(accessToken: accessToken),
      ];
      final results = await Future.wait(futures);
      var resultIndex = 0;
      var nextMembers = const <WorkspaceMember>[];
      var nextFeatures = authorization.features
          .map(
            (feature) => WorkspaceFeatureDetail(
              code: feature.code,
              configuredByEmail: null,
              configuredByUserId: null,
              enabled: feature.enabled,
              updatedAt: null,
            ),
          )
          .toList(growable: false);

      if (canManageMembers) {
        nextMembers = results[resultIndex] as List<WorkspaceMember>;
        resultIndex += 1;
      }

      if (canViewWorkspace) {
        nextFeatures = results[resultIndex] as List<WorkspaceFeatureDetail>;
      }

      if (!mounted) {
        return;
      }

      setState(() {
        _workspaceMembers = nextMembers;
        _workspaceFeatures = nextFeatures;
      });
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _accessError = error.message;
        _workspaceMembers = const <WorkspaceMember>[];
        _workspaceFeatures = authorization.features
            .map(
              (feature) => WorkspaceFeatureDetail(
                code: feature.code,
                configuredByEmail: null,
                configuredByUserId: null,
                enabled: feature.enabled,
                updatedAt: null,
              ),
            )
            .toList(growable: false);
      });
    } finally {
      if (mounted) {
        setState(() {
          _loadingAccess = false;
        });
      }
    }
  }

  Future<void> _saveProfile(String accessToken) async {
    setState(() {
      _submitting = true;
      _error = null;
      _notice = null;
    });

    try {
      final updated = await ref.read(apiClientProvider).updateProfile(
            accessToken: accessToken,
            aboutText: _aboutController.text,
            fullName: _fullNameController.text,
            workspaceName: _workspaceNameController.text,
          );

      if (!mounted) {
        return;
      }

      setState(() {
        _profile = updated;
        _notice = AppStrings.of(context).profileSaved;
      });
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _error = error.message;
      });
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  Future<void> _requestVerificationCode(String accessToken) async {
    setState(() {
      _submitting = true;
      _error = null;
      _notice = null;
    });

    try {
      await ref
          .read(apiClientProvider)
          .requestEmailVerificationCode(accessToken: accessToken);

      if (!mounted) {
        return;
      }

      setState(() {
        _notice = AppStrings.of(context).verificationCodeSent;
      });
      await _loadProfile(accessToken);
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _error = error.message;
      });
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  Future<void> _verifyCode(String accessToken) async {
    setState(() {
      _submitting = true;
      _error = null;
      _notice = null;
    });

    try {
      await ref.read(apiClientProvider).verifyEmailCode(
            accessToken: accessToken,
            code: _verificationCodeController.text.trim(),
          );

      if (!mounted) {
        return;
      }

      _verificationCodeController.clear();

      setState(() {
        _notice = AppStrings.of(context).verificationSucceeded;
      });
      await _loadProfile(accessToken);
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _error = error.message;
      });
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  String _formatDateTime(String? value) {
    if ((value ?? '').isEmpty) {
      return '-';
    }

    final parsed = DateTime.tryParse(value!);
    return parsed?.toLocal().toString() ?? value;
  }

  Future<void> _updateWorkspaceMemberRole(
    String accessToken, {
    required String membershipId,
    required String roleCode,
  }) async {
    setState(() {
      _accessError = null;
      _memberUpdatingId = membershipId;
      _notice = null;
    });

    try {
      await ref.read(apiClientProvider).updateWorkspaceMemberRole(
            accessToken: accessToken,
            membershipId: membershipId,
            roleCode: roleCode,
          );

      if (!mounted) {
        return;
      }

      setState(() {
        _notice = 'Workspace member role updated.';
      });
      await _loadProfile(accessToken);
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _accessError = error.message;
      });
    } finally {
      if (mounted) {
        setState(() {
          _memberUpdatingId = null;
        });
      }
    }
  }

  Future<void> _updateWorkspaceFeature(
    String accessToken, {
    required String code,
    required bool enabled,
  }) async {
    setState(() {
      _accessError = null;
      _featureUpdatingCode = code;
      _notice = null;
    });

    try {
      await ref.read(apiClientProvider).updateWorkspaceFeature(
            accessToken: accessToken,
            code: code,
            enabled: enabled,
          );

      if (!mounted) {
        return;
      }

      setState(() {
        _notice = 'Workspace feature updated.';
      });
      await _loadProfile(accessToken);
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _accessError = error.message;
      });
    } finally {
      if (mounted) {
        setState(() {
          _featureUpdatingCode = null;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final session = ref
        .watch(authControllerProvider)
        .maybeWhen(data: (session) => session, orElse: () => null);
    final accessToken = session?.accessToken;
    final width = MediaQuery.sizeOf(context).width;
    final useSplitLayout = width >= 1000;

    if ((accessToken ?? '').isNotEmpty && _loadedAccessToken != accessToken) {
      _loadedAccessToken = accessToken;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _loadProfile(accessToken!);
        }
      });
    }

    if ((accessToken ?? '').isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Text(strings.profileSignInPrompt),
        ),
      );
    }

    final profile = _profile;
    final authorization = profile?.authorization;
    final canManageMembers =
        authorization?.permissions.contains('members.manage') == true &&
        authorization?.enabledFeatureCodes.contains('team') == true;
    final canManageFeatures =
        authorization?.permissions.contains('features.manage') == true ||
        authorization?.platformRoleCode == 'superadmin';
    final canManageWorkspace =
        authorization?.permissions.contains('workspace.manage') == true ||
        authorization?.platformRoleCode == 'superadmin';

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1180),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                    gradient: const LinearGradient(
                      colors: [AppColors.primaryDark, AppColors.primary],
                    ),
                  ),
                  child: Wrap(
                    spacing: AppSpacing.lg,
                    runSpacing: AppSpacing.md,
                    alignment: WrapAlignment.spaceBetween,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            strings.accountCenter,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            profile?.fullName ??
                                session?.fullName ??
                                strings.profile,
                            style: Theme.of(context)
                                .textTheme
                                .headlineMedium
                                ?.copyWith(color: Colors.white),
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            profile?.email ?? session?.email ?? '',
                            style: const TextStyle(color: Colors.white70),
                          ),
                        ],
                      ),
                      Wrap(
                        spacing: AppSpacing.sm,
                        runSpacing: AppSpacing.sm,
                        children: [
                          _StatusPill(
                            label: profile?.emailVerified == true
                                ? strings.emailVerified
                                : strings.emailNotVerified,
                          ),
                          _StatusPill(
                            label: profile?.workspaceName ??
                                session?.workspaceName ??
                                strings.workspaceName,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                if (_loading)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      child: Text(strings.profileLoading),
                    ),
                  )
                else if ((_error ?? '').isNotEmpty && profile == null)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      child: Text(
                        _error!,
                        style: const TextStyle(color: AppColors.danger),
                      ),
                    ),
                  )
                else
                  useSplitLayout
                      ? Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              flex: 3,
                              child: _MainColumn(
                                aboutController: _aboutController,
                                canEditWorkspaceName: canManageWorkspace,
                                error: _error,
                                fullNameController: _fullNameController,
                                notice: _notice,
                                onRequestCode: () =>
                                    _requestVerificationCode(accessToken!),
                                onSave: () => _saveProfile(accessToken!),
                                onVerify: () => _verifyCode(accessToken!),
                                profile: profile,
                                strings: strings,
                                submitting: _submitting,
                                verificationCodeController:
                                    _verificationCodeController,
                                workspaceNameController:
                                    _workspaceNameController,
                              ),
                            ),
                            const SizedBox(width: AppSpacing.lg),
                            Expanded(
                              flex: 2,
                              child: _SideColumn(
                                formatDateTime: _formatDateTime,
                                profile: profile,
                                strings: strings,
                              ),
                            ),
                          ],
                        )
                      : Column(
                          children: [
                            _MainColumn(
                              aboutController: _aboutController,
                              canEditWorkspaceName: canManageWorkspace,
                              error: _error,
                              fullNameController: _fullNameController,
                              notice: _notice,
                              onRequestCode: () =>
                                  _requestVerificationCode(accessToken!),
                              onSave: () => _saveProfile(accessToken!),
                              onVerify: () => _verifyCode(accessToken!),
                              profile: profile,
                              strings: strings,
                              submitting: _submitting,
                              verificationCodeController:
                                  _verificationCodeController,
                              workspaceNameController: _workspaceNameController,
                            ),
                            const SizedBox(height: AppSpacing.lg),
                            _SideColumn(
                              formatDateTime: _formatDateTime,
                              profile: profile,
                              strings: strings,
                            ),
                          ],
                        ),
                const SizedBox(height: AppSpacing.lg),
                _WorkspaceAccessSection(
                  accessError: _accessError,
                  authorization: authorization,
                  canManageFeatures: canManageFeatures,
                  canManageMembers: canManageMembers,
                  featureUpdatingCode: _featureUpdatingCode,
                  formatDateTime: _formatDateTime,
                  loading: _loadingAccess,
                  memberUpdatingId: _memberUpdatingId,
                  onToggleFeature: accessToken == null
                      ? null
                      : (code, enabled) => _updateWorkspaceFeature(
                            accessToken,
                            code: code,
                            enabled: enabled,
                          ),
                  onUpdateMemberRole: accessToken == null
                      ? null
                      : (membershipId, roleCode) => _updateWorkspaceMemberRole(
                            accessToken,
                            membershipId: membershipId,
                            roleCode: roleCode,
                          ),
                  workspaceFeatures: _workspaceFeatures,
                  workspaceMembers: _workspaceMembers,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _MainColumn extends StatelessWidget {
  const _MainColumn({
    required this.aboutController,
    required this.canEditWorkspaceName,
    required this.error,
    required this.fullNameController,
    required this.notice,
    required this.onRequestCode,
    required this.onSave,
    required this.onVerify,
    required this.profile,
    required this.strings,
    required this.submitting,
    required this.verificationCodeController,
    required this.workspaceNameController,
  });

  final TextEditingController aboutController;
  final bool canEditWorkspaceName;
  final String? error;
  final TextEditingController fullNameController;
  final String? notice;
  final VoidCallback onRequestCode;
  final VoidCallback onSave;
  final VoidCallback onVerify;
  final AccountProfile? profile;
  final AppStrings strings;
  final bool submitting;
  final TextEditingController verificationCodeController;
  final TextEditingController workspaceNameController;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  strings.editProfileTitle,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: AppSpacing.sm),
                TextField(
                  controller: fullNameController,
                  decoration: InputDecoration(labelText: strings.fullName),
                ),
                const SizedBox(height: AppSpacing.md),
                TextField(
                  controller: workspaceNameController,
                  enabled: canEditWorkspaceName,
                  decoration: InputDecoration(labelText: strings.workspaceName),
                ),
                if (!canEditWorkspaceName) ...[
                  const SizedBox(height: AppSpacing.xs),
                  const Text(
                    'Workspace name follows workspace management permission.',
                    style: TextStyle(color: AppColors.muted),
                  ),
                ],
                const SizedBox(height: AppSpacing.md),
                TextField(
                  controller: aboutController,
                  maxLines: 5,
                  decoration: InputDecoration(
                    labelText: strings.about,
                    hintText: strings.aboutHint,
                  ),
                ),
                if ((notice ?? '').isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    notice!,
                    style: const TextStyle(
                      color: AppColors.success,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
                if ((error ?? '').isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    error!,
                    style: const TextStyle(
                      color: AppColors.danger,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
                const SizedBox(height: AppSpacing.lg),
                Align(
                  alignment: Alignment.centerRight,
                  child: FilledButton(
                    onPressed: submitting ? null : onSave,
                    child: Text(
                      submitting ? strings.savingChanges : strings.saveChanges,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  strings.emailVerification,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  profile?.emailVerified == true
                      ? strings.verificationDoneBody
                      : strings.verificationBody,
                ),
                const SizedBox(height: AppSpacing.md),
                if (profile?.emailVerified == true)
                  Text(
                    strings.verifiedAt(_MainColumn._verifiedDate(profile)),
                    style: const TextStyle(
                      color: AppColors.success,
                      fontWeight: FontWeight.w600,
                    ),
                  )
                else
                  Column(
                    children: [
                      TextField(
                        controller: verificationCodeController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: strings.verificationCode,
                          hintText: strings.verificationCodeHint,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Wrap(
                        spacing: AppSpacing.sm,
                        runSpacing: AppSpacing.sm,
                        children: [
                          FilledButton(
                            onPressed: submitting ? null : onVerify,
                            child: Text(
                              submitting
                                  ? strings.verifyingEmail
                                  : strings.verifyEmail,
                            ),
                          ),
                          OutlinedButton(
                            onPressed: submitting ? null : onRequestCode,
                            child: Text(
                              submitting
                                  ? strings.requestingOtpCode
                                  : strings.requestOtpCode,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  static String _verifiedDate(AccountProfile? profile) {
    return profile?.emailVerifiedAt ?? '-';
  }
}

class _SideColumn extends StatelessWidget {
  const _SideColumn({
    required this.formatDateTime,
    required this.profile,
    required this.strings,
  });

  final String Function(String?) formatDateTime;
  final AccountProfile? profile;
  final AppStrings strings;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  strings.securityStatus,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: AppSpacing.sm),
                _InfoRow(
                  label: strings.statusLabel,
                  value: profile?.status ?? '-',
                ),
                _InfoRow(
                  label: strings.workspaceRole,
                  value: profile?.workspaceRole ?? '-',
                ),
                _InfoRow(
                  label: strings.lastLogin,
                  value: formatDateTime(profile?.lastLoginAt),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  strings.connectedAccounts,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: AppSpacing.sm),
                if ((profile?.providers.length ?? 0) == 0)
                  Text(strings.noConnectedAccounts)
                else
                  ...profile!.providers.map(
                    (provider) => Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.md),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(AppRadius.md),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _providerName(strings, provider.provider),
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: AppSpacing.xs),
                            Text(provider.email ?? provider.username ?? '-'),
                            const SizedBox(height: AppSpacing.xs),
                            Text(
                              strings.connectedSince(
                                formatDateTime(provider.connectedAt),
                              ),
                              style: const TextStyle(color: AppColors.muted),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  String _providerName(AppStrings strings, String provider) {
    switch (provider) {
      case 'google':
        return strings.googleLabel;
      case 'facebook':
        return strings.facebookLabel;
      case 'twitter':
        return strings.twitterLabel;
      case 'apple':
        return strings.appleLabel;
      default:
        return provider;
    }
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: AppColors.muted,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(child: Text(value, textAlign: TextAlign.end)),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _WorkspaceAccessSection extends StatelessWidget {
  const _WorkspaceAccessSection({
    required this.accessError,
    required this.authorization,
    required this.canManageFeatures,
    required this.canManageMembers,
    required this.featureUpdatingCode,
    required this.formatDateTime,
    required this.loading,
    required this.memberUpdatingId,
    required this.onToggleFeature,
    required this.onUpdateMemberRole,
    required this.workspaceFeatures,
    required this.workspaceMembers,
  });

  final String? accessError;
  final AuthorizationSummary? authorization;
  final bool canManageFeatures;
  final bool canManageMembers;
  final String? featureUpdatingCode;
  final String Function(String?) formatDateTime;
  final bool loading;
  final String? memberUpdatingId;
  final void Function(String code, bool enabled)? onToggleFeature;
  final void Function(String membershipId, String roleCode)? onUpdateMemberRole;
  final List<WorkspaceFeatureDetail> workspaceFeatures;
  final List<WorkspaceMember> workspaceMembers;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final useTwoColumns = constraints.maxWidth >= 1080;
        final summaryCard = _AccessSummaryCard(authorization: authorization);
        final featuresCard = _WorkspaceFeaturesCard(
          canManageFeatures: canManageFeatures,
          featureUpdatingCode: featureUpdatingCode,
          formatDateTime: formatDateTime,
          loading: loading,
          onToggleFeature: onToggleFeature,
          workspaceFeatures: workspaceFeatures,
        );
        final membersCard = canManageMembers
            ? _WorkspaceMembersCard(
                formatDateTime: formatDateTime,
                memberUpdatingId: memberUpdatingId,
                onUpdateMemberRole: onUpdateMemberRole,
                workspaceMembers: workspaceMembers,
              )
            : null;

        if (useTwoColumns) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 5,
                child: Column(
                  children: [
                    if ((accessError ?? '').isNotEmpty) ...[
                      _ErrorCard(message: accessError!),
                      const SizedBox(height: AppSpacing.lg),
                    ],
                    summaryCard,
                    if (membersCard != null) ...[
                      const SizedBox(height: AppSpacing.lg),
                      membersCard,
                    ],
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.lg),
              Expanded(
                flex: 4,
                child: featuresCard,
              ),
            ],
          );
        }

        return Column(
          children: [
            if ((accessError ?? '').isNotEmpty) ...[
              _ErrorCard(message: accessError!),
              const SizedBox(height: AppSpacing.lg),
            ],
            summaryCard,
            if (membersCard != null) ...[
              const SizedBox(height: AppSpacing.lg),
              membersCard,
            ],
            const SizedBox(height: AppSpacing.lg),
            featuresCard,
          ],
        );
      },
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Text(
          message,
          style: const TextStyle(
            color: AppColors.danger,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

class _AccessSummaryCard extends StatelessWidget {
  const _AccessSummaryCard({required this.authorization});

  final AuthorizationSummary? authorization;

  @override
  Widget build(BuildContext context) {
    final permissions = authorization?.permissions ?? const <String>[];
    final enabledFeatures = authorization?.enabledFeatureCodes ?? const <String>[];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Authorization',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: AppSpacing.sm),
            _InfoRow(
              label: 'Platform role',
              value: authorization?.platformRoleCode ?? 'workspace member',
            ),
            _InfoRow(
              label: 'Workspace role',
              value: authorization?.workspaceRoleCode ?? '-',
            ),
            _InfoRow(
              label: 'Permission count',
              value: permissions.length.toString(),
            ),
            const SizedBox(height: AppSpacing.md),
            const Text(
              'Permissions',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: permissions
                  .map((permission) => _TagChip(label: permission))
                  .toList(growable: false),
            ),
            const SizedBox(height: AppSpacing.lg),
            const Text(
              'Enabled features',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: enabledFeatures
                  .map(
                    (feature) => _TagChip(
                      label: _featureLabels[feature] ?? feature,
                    ),
                  )
                  .toList(growable: false),
            ),
          ],
        ),
      ),
    );
  }
}

class _WorkspaceMembersCard extends StatelessWidget {
  const _WorkspaceMembersCard({
    required this.formatDateTime,
    required this.memberUpdatingId,
    required this.onUpdateMemberRole,
    required this.workspaceMembers,
  });

  final String Function(String?) formatDateTime;
  final String? memberUpdatingId;
  final void Function(String membershipId, String roleCode)? onUpdateMemberRole;
  final List<WorkspaceMember> workspaceMembers;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Workspace members',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: AppSpacing.sm),
            const Text('Assign the right workspace role to each teammate.'),
            const SizedBox(height: AppSpacing.md),
            if (workspaceMembers.isEmpty)
              const Text(
                'No workspace members found.',
                style: TextStyle(color: AppColors.muted),
              )
            else
              ...workspaceMembers.map(
                (member) => Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.md),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          member.fullName ?? member.email,
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          member.email,
                          style: const TextStyle(color: AppColors.muted),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          'Joined ${formatDateTime(member.joinedAt)}',
                          style: const TextStyle(color: AppColors.muted),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        DropdownButtonFormField<String>(
                          initialValue: member.roleCode,
                          decoration: const InputDecoration(labelText: 'Role'),
                          items: _workspaceRoleOptions
                              .map(
                                (role) => DropdownMenuItem<String>(
                                  value: role,
                                  child: Text(role),
                                ),
                              )
                              .toList(growable: false),
                          onChanged:
                              member.roleCode == 'owner' ||
                                  memberUpdatingId == member.id ||
                                  onUpdateMemberRole == null
                              ? null
                              : (value) {
                                  if (value == null || value == member.roleCode) {
                                    return;
                                  }

                                  onUpdateMemberRole!(member.id, value);
                                },
                        ),
                        if (member.roleCode == 'owner') ...[
                          const SizedBox(height: AppSpacing.xs),
                          const Text(
                            'Owner transfer is not available yet.',
                            style: TextStyle(color: AppColors.muted),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _WorkspaceFeaturesCard extends StatelessWidget {
  const _WorkspaceFeaturesCard({
    required this.canManageFeatures,
    required this.featureUpdatingCode,
    required this.formatDateTime,
    required this.loading,
    required this.onToggleFeature,
    required this.workspaceFeatures,
  });

  final bool canManageFeatures;
  final String? featureUpdatingCode;
  final String Function(String?) formatDateTime;
  final bool loading;
  final void Function(String code, bool enabled)? onToggleFeature;
  final List<WorkspaceFeatureDetail> workspaceFeatures;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Workspace features',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              canManageFeatures
                  ? 'Enable or disable modules for this workspace.'
                  : 'Current feature state for this workspace.',
            ),
            const SizedBox(height: AppSpacing.md),
            if (loading && workspaceFeatures.isEmpty)
              const Text(
                'Loading workspace features...',
                style: TextStyle(color: AppColors.muted),
              )
            else if (workspaceFeatures.isEmpty)
              const Text(
                'No workspace feature data available.',
                style: TextStyle(color: AppColors.muted),
              )
            else
              ...workspaceFeatures.map(
                (feature) => SwitchListTile.adaptive(
                  value: feature.enabled,
                  onChanged:
                      !canManageFeatures ||
                          featureUpdatingCode == feature.code ||
                          onToggleFeature == null
                      ? null
                      : (value) => onToggleFeature!(feature.code, value),
                  title: Text(_featureLabels[feature.code] ?? feature.code),
                  subtitle: Text(
                    feature.configuredByEmail == null
                        ? 'Workspace default'
                        : 'Updated by ${feature.configuredByEmail} on ${formatDateTime(feature.updatedAt)}',
                  ),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _TagChip extends StatelessWidget {
  const _TagChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.border),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
