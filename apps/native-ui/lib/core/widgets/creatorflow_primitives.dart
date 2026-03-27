import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_radius.dart';
import '../theme/app_spacing.dart';

class PremiumBackdrop extends StatelessWidget {
  const PremiumBackdrop({
    required this.child,
    super.key,
  });

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(
          child: DecoratedBox(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                stops: [0, 0.34, 0.34, 1],
                colors: [
                  AppColors.inkDeep,
                  AppColors.shellTop,
                  AppColors.surface,
                  AppColors.surface,
                ],
              ),
            ),
          ),
        ),
        const Positioned(
          left: -120,
          top: -80,
          child: _GlowOrb(
            size: 280,
            colors: [AppColors.primarySoft, Colors.transparent],
            opacity: 0.2,
          ),
        ),
        const Positioned(
          right: -110,
          top: -60,
          child: _GlowOrb(
            size: 260,
            colors: [AppColors.accentWarm, Colors.transparent],
            opacity: 0.16,
          ),
        ),
        child,
      ],
    );
  }
}

class CreatorFlowMark extends StatelessWidget {
  const CreatorFlowMark({
    super.key,
    this.compact = false,
    this.onDark = false,
    this.iconOnly = false,
  });

  final bool compact;
  final bool onDark;
  final bool iconOnly;

  @override
  Widget build(BuildContext context) {
    final titleStyle = compact
        ? Theme.of(context).textTheme.titleLarge
        : Theme.of(context).textTheme.headlineSmall;
    final titleColor = onDark ? Colors.white : AppColors.ink;
    final subtitleColor = onDark
        ? Colors.white.withValues(alpha: 0.72)
        : AppColors.muted;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: compact ? 42 : 52,
          height: compact ? 42 : 52,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.pill),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppColors.ink,
                AppColors.primary,
                AppColors.accentWarm,
              ],
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.ink.withValues(alpha: 0.18),
                blurRadius: 22,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          alignment: Alignment.center,
          child: Text(
            'CF',
            style: TextStyle(
              color: Colors.white,
              fontSize: compact ? 16 : 18,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.5,
            ),
          ),
        ),
        if (!iconOnly) ...[
          const SizedBox(width: AppSpacing.md),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'CreatorFlow',
                style: titleStyle?.copyWith(
                  color: titleColor,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                'COMMERCE OS',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: subtitleColor,
                      letterSpacing: 2.2,
                    ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

class PremiumSurfaceCard extends StatelessWidget {
  const PremiumSurfaceCard({
    required this.child,
    super.key,
    this.padding = const EdgeInsets.all(AppSpacing.lg),
    this.margin = EdgeInsets.zero,
    this.color = AppColors.card,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.ink.withValues(alpha: 0.08),
            blurRadius: 28,
            offset: const Offset(0, 16),
          ),
        ],
      ),
      child: child,
    );
  }
}

class PremiumGradientCard extends StatelessWidget {
  const PremiumGradientCard({
    required this.child,
    super.key,
    this.padding = const EdgeInsets.all(AppSpacing.xl),
    this.margin = EdgeInsets.zero,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF102C45),
            Color(0xFF0A5F6C),
            Color(0xFF0F8590),
            Color(0xFFE6A160),
          ],
          stops: [0, 0.45, 0.76, 1],
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.ink.withValues(alpha: 0.18),
            blurRadius: 34,
            offset: const Offset(0, 18),
          ),
        ],
      ),
      child: child,
    );
  }
}

class PremiumPill extends StatelessWidget {
  const PremiumPill({
    required this.label,
    super.key,
    this.background = Colors.white,
    this.foreground = AppColors.ink,
    this.padding,
    this.borderColor,
  });

  final String label;
  final Color background;
  final Color foreground;
  final EdgeInsetsGeometry? padding;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ??
          const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: 10,
          ),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(AppRadius.pill),
        border: borderColor == null ? null : Border.all(color: borderColor!),
      ),
      child: Text(
        label,
        textAlign: TextAlign.center,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: foreground,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.6,
            ),
      ),
    );
  }
}

class SectionEyebrow extends StatelessWidget {
  const SectionEyebrow(this.label, {super.key, this.onDark = false});

  final String label;
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    return Text(
      label.toUpperCase(),
      style: Theme.of(context).textTheme.labelMedium?.copyWith(
            color: onDark
                ? Colors.white.withValues(alpha: 0.74)
                : AppColors.primary,
            letterSpacing: 3,
          ),
    );
  }
}

class RevealMotion extends StatefulWidget {
  const RevealMotion({
    required this.child,
    super.key,
    this.delay = Duration.zero,
    this.duration = const Duration(milliseconds: 560),
    this.offset = const Offset(0, 20),
  });

  final Widget child;
  final Duration delay;
  final Duration duration;
  final Offset offset;

  @override
  State<RevealMotion> createState() => _RevealMotionState();
}

class _RevealMotionState extends State<RevealMotion>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _opacity;
  late final Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration,
    );
    _opacity = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    );
    _slide = Tween<Offset>(
      begin: widget.offset,
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOutCubic,
      ),
    );
    _start();
  }

  Future<void> _start() async {
    if (widget.delay > Duration.zero) {
      await Future<void>.delayed(widget.delay);
    }
    if (mounted) {
      _controller.forward();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.maybeOf(context);
    final reduceMotion =
        (mediaQuery?.disableAnimations ?? false) ||
        (mediaQuery?.accessibleNavigation ?? false);

    if (reduceMotion) {
      return widget.child;
    }

    return AnimatedBuilder(
      animation: _controller,
      child: widget.child,
      builder: (context, child) {
        return Opacity(
          opacity: _opacity.value.clamp(0, 1),
          child: Transform.translate(
            offset: Offset(
              _slide.value.dx,
              _slide.value.dy,
            ),
            child: child,
          ),
        );
      },
    );
  }
}

class _GlowOrb extends StatelessWidget {
  const _GlowOrb({
    required this.size,
    required this.colors,
    required this.opacity,
  });

  final double size;
  final List<Color> colors;
  final double opacity;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: colors
                .map((color) => color.withValues(alpha: opacity))
                .toList(growable: false),
          ),
        ),
      ),
    );
  }
}
