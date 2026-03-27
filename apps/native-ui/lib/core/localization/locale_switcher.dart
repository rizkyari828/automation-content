import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../theme/app_colors.dart';
import '../theme/app_radius.dart';
import 'app_locale_controller.dart';
import 'app_strings.dart';

class LocaleSwitcher extends ConsumerWidget {
  const LocaleSwitcher({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final language = ref.watch(appLocaleProvider).maybeWhen(
          data: (language) => language,
          orElse: () => AppLanguage.english,
        );

    return Semantics(
      label: strings.languageLabel,
      child: Container(
        padding: EdgeInsets.all(compact ? 4 : 6),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.92),
          borderRadius: BorderRadius.circular(AppRadius.pill),
          border: Border.all(color: AppColors.border),
          boxShadow: const [
            BoxShadow(
              color: Color(0x140F172A),
              blurRadius: 20,
              offset: Offset(0, 10),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: compact ? 30 : 34,
              height: compact ? 30 : 34,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppRadius.pill),
              ),
              child: const Icon(
                Icons.language_rounded,
                color: AppColors.ink,
                size: 18,
              ),
            ),
            if (!compact) ...[
              const SizedBox(width: 10),
              Text(
                strings.languageLabel.toUpperCase(),
                style: const TextStyle(
                  color: AppColors.muted,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.1,
                ),
              ),
              const SizedBox(width: 10),
            ] else
              const SizedBox(width: 6),
            _LocaleButton(
              active: language == AppLanguage.indonesian,
              compact: compact,
              label: 'ID',
              onTap: () {
                ref
                    .read(appLocaleProvider.notifier)
                    .setLanguage(AppLanguage.indonesian);
              },
              tooltip: strings.indonesianLabel,
            ),
            const SizedBox(width: 4),
            _LocaleButton(
              active: language == AppLanguage.english,
              compact: compact,
              label: 'EN',
              onTap: () {
                ref
                    .read(appLocaleProvider.notifier)
                    .setLanguage(AppLanguage.english);
              },
              tooltip: strings.englishLabel,
            ),
          ],
        ),
      ),
    );
  }
}

class _LocaleButton extends StatelessWidget {
  const _LocaleButton({
    required this.active,
    required this.compact,
    required this.label,
    required this.onTap,
    required this.tooltip,
  });

  final bool active;
  final bool compact;
  final String label;
  final VoidCallback onTap;
  final String tooltip;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: active ? AppColors.ink : Colors.transparent,
        borderRadius: BorderRadius.circular(AppRadius.pill),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppRadius.pill),
          onTap: onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            curve: Curves.easeOut,
            alignment: Alignment.center,
            constraints: BoxConstraints(
              minWidth: compact ? 42 : 48,
              minHeight: compact ? 30 : 34,
            ),
            padding: EdgeInsets.symmetric(
              horizontal: compact ? 10 : 12,
              vertical: compact ? 6 : 7,
            ),
            child: Text(
              label,
              style: TextStyle(
                color: active ? Colors.white : AppColors.ink,
                fontSize: 13,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.8,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
