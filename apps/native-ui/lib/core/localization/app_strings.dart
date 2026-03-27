import 'package:flutter/widgets.dart';

import 'generated_app_strings_data.dart';

class AppStrings {
  const AppStrings._(this._messages);

  final Map<String, Object> _messages;

  static AppStrings fromLanguageCode(String languageCode) {
    final normalizedLanguage = languageCode == 'id' ? 'id' : 'en';
    return AppStrings._(generatedAppStringsData[normalizedLanguage]!);
  }

  static AppStrings of(BuildContext context) {
    final languageCode = Localizations.localeOf(context).languageCode;
    return fromLanguageCode(languageCode);
  }

  String _text(String key) {
    return _messages[key]! as String;
  }

  String _format(String key, Map<String, Object> values) {
    return values.entries.fold(
      _text(key),
      (message, entry) =>
          message.replaceAll('{{${entry.key}}}', entry.value.toString()),
    );
  }

  String get appTitle => _text('appTitle');
  String get appBrandName => _text('appBrandName');
  String get languageLabel => _text('languageLabel');
  String get englishLabel => _text('englishLabel');
  String get indonesianLabel => _text('indonesianLabel');
  String get dashboard => _text('dashboard');
  String get content => _text('content');
  String get trend => _text('trend');
  String get assets => _text('assets');
  String get billing => _text('billing');
  String get profile => _text('profile');
  String get nativeShellAligned => _text('nativeShellAligned');
  String signedInAs(String email) =>
      _format('signedInAsTemplate', {'email': email});
  String get previewMode => _text('previewMode');
  String get signOut => _text('signOut');

  String get signInTitle => _text('signInTitle');
  String signInSubtitle(String appName) =>
      _format('signInSubtitleTemplate', {'appName': appName});
  String get email => _text('email');
  String get emailHint => _text('emailHint');
  String get password => _text('password');
  String get passwordHint => _text('passwordHint');
  String get fullName => _text('fullName');
  String get connecting => _text('connecting');
  String get enterWorkspace => _text('enterWorkspace');
  String get needAccount => _text('needAccount');
  String get forgotPasswordLink => _text('forgotPasswordLink');
  String get signInWithProviders => _text('signInWithProviders');
  String get signUpWithProviders => _text('signUpWithProviders');
  String get continueWithGoogle => _text('continueWithGoogle');
  String get continueWithTwitter => _text('continueWithTwitter');
  String get continueWithFacebook => _text('continueWithFacebook');
  String get continueWithApple => _text('continueWithApple');
  String get nativeSsoHint => _text('nativeSsoHint');
  String get authContract => _text('authContract');
  String authClientInfo(String clientType, String apiBaseUrl) => _format(
    'authClientInfoTemplate',
    {'clientType': clientType, 'apiBaseUrl': apiBaseUrl},
  );
  String get attentionQuote => _text('attentionQuote');
  String get signInSideBody => _text('signInSideBody');

  String get createWorkspaceTitle => _text('createWorkspaceTitle');
  String get createWorkspaceSubtitle => _text('createWorkspaceSubtitle');
  String get workspaceName => _text('workspaceName');
  String get creating => _text('creating');
  String get createAndContinue => _text('createAndContinue');
  String get forgotPasswordTitle => _text('forgotPasswordTitle');
  String get forgotPasswordSubtitle => _text('forgotPasswordSubtitle');
  String get otpCode => _text('otpCode');
  String get otpCodeHint => _text('otpCodeHint');
  String get newPassword => _text('newPassword');
  String get newPasswordHint => _text('newPasswordHint');
  String get requestResetCode => _text('requestResetCode');
  String get requestingResetCode => _text('requestingResetCode');
  String get resetPassword => _text('resetPassword');
  String get resettingPassword => _text('resettingPassword');
  String get requestAnotherCode => _text('requestAnotherCode');
  String get backToSignIn => _text('backToSignIn');
  String get resetCodeSent => _text('resetCodeSent');
  String get passwordResetSuccess => _text('passwordResetSuccess');
  String get forgotPasswordSideTitle => _text('forgotPasswordSideTitle');
  String get forgotPasswordSideBody => _text('forgotPasswordSideBody');

  String get contentPipeline => _text('contentPipeline');
  String get contentPipelineBody => _text('contentPipelineBody');
  String get assetLibrary => _text('assetLibrary');
  String get assetLibraryBody => _text('assetLibraryBody');
  String get watchlistOverview => _text('watchlistOverview');
  String get watchlistOverviewBody => _text('watchlistOverviewBody');
  String get billingOverview => _text('billingOverview');
  String get billingOverviewBody => _text('billingOverviewBody');
  String get profileSummaryBody => _text('profileSummaryBody');
  String get publicRelationsRole => _text('publicRelationsRole');

  String get trendWatchlist => _text('trendWatchlist');
  String get workspaceDetails => _text('workspaceDetails');
  String get noItemsYet => _text('noItemsYet');
  String get noItemsBody => _text('noItemsBody');
  String get noDetailsYet => _text('noDetailsYet');
  String get noDetailsBody => _text('noDetailsBody');
  String fromLastCheckpoint(String delta) =>
      _format('fromLastCheckpointTemplate', {'delta': delta});
  String unableToLoadDashboard(Object error) =>
      _format('unableToLoadDashboardTemplate', {'error': error});

  String get welcomeCreatorFlow => _text('welcomeCreatorFlow');
  String get signInToLoadWorkspace => _text('signInToLoadWorkspace');
  String get workspaceMetric => _text('workspaceMetric');
  String get watchlistItems => _text('watchlistItems');
  String get activeRecommendations => _text('activeRecommendations');
  String get latestDigest => _text('latestDigest');
  String get notReadyYet => _text('notReadyYet');
  String get clientType => _text('clientType');
  String get member => _text('member');
  String get connected => _text('connected');
  String get active => _text('active');
  String get profileIncomplete => _text('profileIncomplete');
  String get nativeAuthReady => _text('nativeAuthReady');
  String get noDigestYet => _text('noDigestYet');
  String workspaceOverview(String name) =>
      _format('workspaceOverviewTemplate', {'name': name});
  String get overview => _text('overview');
  String get profileLoading => _text('profileLoading');
  String get profileSignInPrompt => _text('profileSignInPrompt');
  String get accountCenter => _text('accountCenter');
  String get editProfileTitle => _text('editProfileTitle');
  String get about => _text('about');
  String get aboutHint => _text('aboutHint');
  String get saveChanges => _text('saveChanges');
  String get savingChanges => _text('savingChanges');
  String get profileSaved => _text('profileSaved');
  String get emailVerification => _text('emailVerification');
  String get verificationBody => _text('verificationBody');
  String get verificationDoneBody => _text('verificationDoneBody');
  String get emailVerified => _text('emailVerified');
  String get emailNotVerified => _text('emailNotVerified');
  String get verificationCode => _text('verificationCode');
  String get verificationCodeHint => _text('verificationCodeHint');
  String get requestOtpCode => _text('requestOtpCode');
  String get requestingOtpCode => _text('requestingOtpCode');
  String get verifyEmail => _text('verifyEmail');
  String get verifyingEmail => _text('verifyingEmail');
  String get verificationCodeSent => _text('verificationCodeSent');
  String get verificationSucceeded => _text('verificationSucceeded');
  String get securityStatus => _text('securityStatus');
  String get statusLabel => _text('statusLabel');
  String get lastLogin => _text('lastLogin');
  String get workspaceRole => _text('workspaceRole');
  String get connectedAccounts => _text('connectedAccounts');
  String get noConnectedAccounts => _text('noConnectedAccounts');
  String connectedSince(String date) =>
      _format('connectedSinceTemplate', {'date': date});
  String verifiedAt(String date) =>
      _format('verifiedAtTemplate', {'date': date});
  String get googleLabel => _text('googleLabel');
  String get facebookLabel => _text('facebookLabel');
  String get twitterLabel => _text('twitterLabel');
  String get appleLabel => _text('appleLabel');
}
