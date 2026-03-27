enum SocialAuthProvider {
  google('google'),
  twitter('twitter'),
  facebook('facebook'),
  apple('apple');

  const SocialAuthProvider(this.code);

  final String code;
}
