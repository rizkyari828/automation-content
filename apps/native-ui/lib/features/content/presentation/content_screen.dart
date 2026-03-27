import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/creatorflow_primitives.dart';

class ContentScreen extends StatelessWidget {
  const ContentScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isId = Localizations.localeOf(context).languageCode == 'id';

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1380),
            child: Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.xl),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RevealMotion(
                    child: _ContentHero(isId: isId),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  RevealMotion(
                    delay: const Duration(milliseconds: 90),
                    child: _StageGrid(isId: isId),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  RevealMotion(
                    delay: const Duration(milliseconds: 170),
                    child: _ExecutionSection(isId: isId),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ContentHero extends StatelessWidget {
  const _ContentHero({required this.isId});

  final bool isId;

  @override
  Widget build(BuildContext context) {
    return PremiumGradientCard(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final stacked = constraints.maxWidth < 980;
          final title = isId
              ? 'Dari brief ke batch konten yang siap review.'
              : 'Move from brief to a review-ready content batch.';
          final body = isId
              ? 'Tim bisa generate angle, naskah, caption, dan handoff publish dari satu pipeline yang terasa tenang, cepat, dan premium.'
              : 'Generate angles, scripts, captions, and publishing handoff inside one calmer, faster, more premium pipeline.';
          final pills = [
            isId ? '42 DRAFT DI QUEUE' : '42 DRAFTS IN QUEUE',
            isId ? '9 REVIEW HARI INI' : '9 REVIEWS TODAY',
            isId ? '3 BATCH SIAP TAYANG' : '3 BATCHES READY',
          ];

          final summary = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SectionEyebrow(
                isId ? 'Pipeline konten' : 'Content pipeline',
                onDark: true,
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                title,
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      color: Colors.white,
                      fontSize: stacked ? 38 : 48,
                    ),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                body,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.white.withValues(alpha: 0.82),
                    ),
              ),
            ],
          );

          final rail = Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: pills
                .map(
                  (pill) => PremiumPill(
                    label: pill,
                    background: Colors.white,
                    foreground: AppColors.ink,
                  ),
                )
                .toList(growable: false),
          );

          if (stacked) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                summary,
                const SizedBox(height: AppSpacing.lg),
                rail,
              ],
            );
          }

          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(flex: 6, child: summary),
              const SizedBox(width: AppSpacing.lg),
              Expanded(flex: 4, child: rail),
            ],
          );
        },
      ),
    );
  }
}

class _StageGrid extends StatelessWidget {
  const _StageGrid({required this.isId});

  final bool isId;

  @override
  Widget build(BuildContext context) {
    final stages = [
      (
        icon: Icons.lightbulb_rounded,
        title: isId ? 'Angle siap jual' : 'Selling angles',
        body: isId
            ? 'Satu produk bisa dipecah jadi hook problem-solution, urgency, testimonial, dan creator-led copy.'
            : 'Turn one product into problem-solution, urgency, testimonial, and creator-led angles.',
      ),
      (
        icon: Icons.edit_note_rounded,
        title: isId ? 'Draft lebih cepat' : 'Faster drafts',
        body: isId
            ? 'Script, caption, subtitle, dan CTA block masuk dalam ritme kerja yang sama.'
            : 'Scripts, captions, subtitles, and CTA blocks move inside the same working rhythm.',
      ),
      (
        icon: Icons.publish_rounded,
        title: isId ? 'Handoff rapi' : 'Cleaner handoff',
        body: isId
            ? 'Reviewer, editor, dan operator publish dapat konteks yang tetap utuh sampai tayang.'
            : 'Reviewers, editors, and publishing operators keep context intact through handoff.',
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 1160
            ? 3
            : constraints.maxWidth >= 760
                ? 2
                : 1;
        final cardWidth = columns == 1
            ? constraints.maxWidth
            : (constraints.maxWidth - (AppSpacing.md * (columns - 1))) /
                columns;

        return Wrap(
          spacing: AppSpacing.md,
          runSpacing: AppSpacing.md,
          children: stages
              .map(
                (stage) => SizedBox(
                  width: cardWidth,
                  child: PremiumSurfaceCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 54,
                          height: 54,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(AppRadius.pill),
                            gradient: const LinearGradient(
                              colors: [
                                AppColors.ink,
                                AppColors.primary,
                                AppColors.accentWarm,
                              ],
                            ),
                          ),
                          child: Icon(stage.icon, color: Colors.white),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Text(
                          stage.title,
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          stage.body,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                ),
              )
              .toList(growable: false),
        );
      },
    );
  }
}

class _ExecutionSection extends StatelessWidget {
  const _ExecutionSection({required this.isId});

  final bool isId;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final stacked = constraints.maxWidth < 980;

        final queueCard = PremiumSurfaceCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isId ? 'Queue eksekusi' : 'Execution queue',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                isId
                    ? 'Lihat status produksi dari brief sampai publish.'
                    : 'Track production status from brief to publish.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: AppSpacing.lg),
              const _QueueRow(
                step: '01',
                title: 'Brief approved',
                note: '12 item',
                tone: AppColors.info,
              ),
              const _QueueRow(
                step: '02',
                title: 'Draft in review',
                note: '9 item',
                tone: AppColors.warning,
              ),
              const _QueueRow(
                step: '03',
                title: 'Publish tonight',
                note: '3 channel',
                tone: AppColors.success,
              ),
            ],
          ),
        );

        final boardCard = PremiumSurfaceCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isId ? 'Board produksi' : 'Production board',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                isId
                    ? 'Contoh density layout untuk mobile, tablet, dan desktop.'
                    : 'A denser layout sample for mobile, tablet, and desktop.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: AppSpacing.lg),
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: const [
                    _MiniBoardRow(
                      label: 'Angle hooks',
                      progress: 0.88,
                      tone: AppColors.primary,
                    ),
                    SizedBox(height: AppSpacing.md),
                    _MiniBoardRow(
                      label: 'Caption packs',
                      progress: 0.62,
                      tone: AppColors.info,
                    ),
                    SizedBox(height: AppSpacing.md),
                    _MiniBoardRow(
                      label: 'Publish handoff',
                      progress: 0.34,
                      tone: AppColors.accentWarm,
                    ),
                  ],
                ),
              ),
            ],
          ),
        );

        if (stacked) {
          return Column(
            children: [
              queueCard,
              const SizedBox(height: AppSpacing.lg),
              boardCard,
            ],
          );
        }

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: queueCard),
            const SizedBox(width: AppSpacing.lg),
            Expanded(child: boardCard),
          ],
        );
      },
    );
  }
}

class _QueueRow extends StatelessWidget {
  const _QueueRow({
    required this.step,
    required this.title,
    required this.note,
    required this.tone,
  });

  final String step;
  final String title;
  final String note;
  final Color tone;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: tone.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(AppRadius.pill),
            ),
            alignment: Alignment.center,
            child: Text(
              step,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: tone,
                    fontWeight: FontWeight.w800,
                  ),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(
              title,
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          PremiumPill(
            label: note.toUpperCase(),
            background: tone,
            foreground: Colors.white,
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.sm,
              vertical: 8,
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniBoardRow extends StatelessWidget {
  const _MiniBoardRow({
    required this.label,
    required this.progress,
    required this.tone,
  });

  final String label;
  final double progress;
  final Color tone;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: Theme.of(context).textTheme.titleSmall,
              ),
            ),
            Text(
              '${(progress * 100).round()}%',
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: tone,
                  ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.pill),
          child: LinearProgressIndicator(
            minHeight: 10,
            value: progress,
            backgroundColor: AppColors.border,
            valueColor: AlwaysStoppedAnimation<Color>(tone),
          ),
        ),
      ],
    );
  }
}
