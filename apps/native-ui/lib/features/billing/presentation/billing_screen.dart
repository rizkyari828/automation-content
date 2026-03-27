import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/creatorflow_primitives.dart';

class BillingScreen extends StatelessWidget {
  const BillingScreen({super.key});

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
                    child: PremiumGradientCard(
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          final stacked = constraints.maxWidth < 980;
                          final metricsMaxWidth = constraints.maxWidth;
                          final metricColumns = metricsMaxWidth >= 1220
                              ? 3
                              : metricsMaxWidth >= 760
                                  ? 2
                                  : 1;
                          final metricWidth = metricColumns == 1
                              ? metricsMaxWidth
                              : (metricsMaxWidth -
                                          (AppSpacing.md * (metricColumns - 1))) /
                                      metricColumns;
                          final summary = Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              SectionEyebrow(
                                isId ? 'Paket aktif' : 'Active plan',
                                onDark: true,
                              ),
                              const SizedBox(height: AppSpacing.md),
                              Text(
                                'CreatorFlow Growth',
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineLarge
                                    ?.copyWith(color: Colors.white),
                              ),
                              const SizedBox(height: AppSpacing.sm),
                              Text(
                                isId
                                    ? 'Dirancang untuk seller dan affiliate yang butuh ritme output harian.'
                                    : 'Built for sellers and affiliates who need a steadier daily output rhythm.',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyLarge
                                    ?.copyWith(
                                      color: Colors.white.withValues(alpha: 0.82),
                                    ),
                              ),
                            ],
                          );
                          final metrics = Wrap(
                            spacing: AppSpacing.md,
                            runSpacing: AppSpacing.md,
                            children: [
                              _PlanMetric(
                                label: 'SEAT TERPAKAI',
                                value: '8 dari 12',
                                note: '4 seat masih tersedia',
                                width: metricWidth,
                              ),
                              _PlanMetric(
                                label: 'LIMIT DRAFT',
                                value: '1.480 / bulan',
                                note: '62% kapasitas bulan ini',
                                width: metricWidth,
                              ),
                              _PlanMetric(
                                label: 'RENDER QUEUE',
                                value: '36 aset',
                                note: 'Rata-rata selesai 2.1 jam',
                                width: metricWidth,
                              ),
                            ],
                          );

                          if (stacked) {
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                summary,
                                const SizedBox(height: AppSpacing.lg),
                                metrics,
                              ],
                            );
                          }

                          return Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(flex: 5, child: summary),
                              const SizedBox(width: AppSpacing.lg),
                              Expanded(flex: 4, child: metrics),
                            ],
                          );
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  RevealMotion(
                    delay: const Duration(milliseconds: 90),
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        final stacked = constraints.maxWidth < 980;

                        if (stacked) {
                          return Column(
                            children: [
                              _PaymentMethodsCard(isId: isId),
                              const SizedBox(height: AppSpacing.lg),
                              _InvoicesCard(isId: isId),
                            ],
                          );
                        }

                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              flex: 6,
                              child: _PaymentMethodsCard(isId: isId),
                            ),
                            const SizedBox(width: AppSpacing.lg),
                            Expanded(
                              flex: 5,
                              child: _InvoicesCard(isId: isId),
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  RevealMotion(
                    delay: const Duration(milliseconds: 170),
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        final stacked = constraints.maxWidth < 980;

                        if (stacked) {
                          return Column(
                            children: [
                              _TeamUsageCard(isId: isId),
                              const SizedBox(height: AppSpacing.lg),
                              _ActivityCard(isId: isId),
                            ],
                          );
                        }

                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              flex: 7,
                              child: _TeamUsageCard(isId: isId),
                            ),
                            const SizedBox(width: AppSpacing.lg),
                            Expanded(
                              flex: 4,
                              child: _ActivityCard(isId: isId),
                            ),
                          ],
                        );
                      },
                    ),
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

class _PlanMetric extends StatelessWidget {
  const _PlanMetric({
    required this.label,
    required this.value,
    required this.note,
    required this.width,
  });

  final String label;
  final String value;
  final String note;
  final double width;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.72),
                ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: Colors.white,
                ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            note,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.76),
                ),
          ),
        ],
      ),
    );
  }
}

class _PaymentMethodsCard extends StatelessWidget {
  const _PaymentMethodsCard({required this.isId});

  final bool isId;

  @override
  Widget build(BuildContext context) {
    return PremiumSurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isId ? 'Metode pembayaran' : 'Payment methods',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            isId
                ? 'Pilih metode yang paling familiar untuk operasional tim di Indonesia.'
                : 'Choose the most familiar method for day-to-day team operations.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.lg),
          const _PaymentRow(
            icon: Icons.credit_card_rounded,
            title: 'Virtual Account BCA',
            detail: 'Auto debit bulanan aktif',
            note: 'Diverifikasi untuk workspace utama',
            badgeLabel: 'UTAMA',
            badgeTone: AppColors.success,
          ),
          const _PaymentRow(
            icon: Icons.account_balance_wallet_rounded,
            title: 'Kartu bisnis Visa',
            detail: 'Cadangan jika auto debit gagal',
            note: 'Pemilik kartu: Rani Setiawan',
            badgeLabel: 'CADANGAN',
            badgeTone: AppColors.info,
          ),
          const _PaymentRow(
            icon: Icons.qr_code_rounded,
            title: 'QRIS bisnis',
            detail: 'Tersedia untuk top-up add-on',
            note: 'Dipakai untuk pembelian kredit ekstra',
            badgeLabel: 'OPSIONAL',
            badgeTone: AppColors.mutedStrong,
          ),
        ],
      ),
    );
  }
}

class _PaymentRow extends StatelessWidget {
  const _PaymentRow({
    required this.icon,
    required this.title,
    required this.detail,
    required this.note,
    required this.badgeLabel,
    required this.badgeTone,
  });

  final IconData icon;
  final String title;
  final String detail;
  final String note;
  final String badgeLabel;
  final Color badgeTone;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final stacked = constraints.maxWidth < 560;

          final iconBadge = Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: AppColors.surfaceMuted,
              borderRadius: BorderRadius.circular(AppRadius.pill),
            ),
            child: Icon(icon, color: AppColors.primaryDark),
          );
          final details = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: AppSpacing.xs),
              Text(detail, style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: AppSpacing.xs),
              Text(
                note,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.mutedStrong,
                    ),
              ),
            ],
          );
          final badge = PremiumPill(
            label: badgeLabel,
            background: badgeTone,
            foreground: Colors.white,
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: 9,
            ),
          );

          if (stacked) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    iconBadge,
                    const SizedBox(width: AppSpacing.md),
                    Expanded(child: details),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                badge,
              ],
            );
          }

          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              iconBadge,
              const SizedBox(width: AppSpacing.md),
              Expanded(child: details),
              const SizedBox(width: AppSpacing.md),
              badge,
            ],
          );
        },
      ),
    );
  }
}

class _InvoicesCard extends StatelessWidget {
  const _InvoicesCard({required this.isId});

  final bool isId;

  @override
  Widget build(BuildContext context) {
    return PremiumSurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isId ? 'Invoice terbaru' : 'Latest invoices',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            isId
                ? 'Riwayat invoice yang siap dibagikan ke tim finance.'
                : 'Invoice history ready to share with the finance team.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.lg),
          ...const [
            _InvoiceRow(period: 'Maret 2026', code: 'INV-CF-2026-0318', amount: 'Rp1.490.000', status: 'Lunas'),
            _InvoiceRow(period: 'Februari 2026', code: 'INV-CF-2026-0220', amount: 'Rp1.490.000', status: 'Lunas'),
            _InvoiceRow(period: 'Januari 2026', code: 'INV-CF-2026-0118', amount: 'Rp1.290.000', status: 'Lunas'),
          ],
          const SizedBox(height: AppSpacing.md),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () {},
              child: Text(isId ? 'Lihat semua invoice' : 'View all invoices'),
            ),
          ),
        ],
      ),
    );
  }
}

class _InvoiceRow extends StatelessWidget {
  const _InvoiceRow({
    required this.period,
    required this.code,
    required this.amount,
    required this.status,
  });

  final String period;
  final String code;
  final String amount;
  final String status;

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
      child: LayoutBuilder(
        builder: (context, constraints) {
          final stacked = constraints.maxWidth < 420;

          final leading = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(period, style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: AppSpacing.xs),
              Text(code, style: Theme.of(context).textTheme.bodySmall),
            ],
          );
          final trailing = Column(
            crossAxisAlignment: stacked
                ? CrossAxisAlignment.start
                : CrossAxisAlignment.end,
            children: [
              Text(amount, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: AppSpacing.xs),
              Text(status, style: Theme.of(context).textTheme.bodySmall),
            ],
          );

          if (stacked) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                leading,
                const SizedBox(height: AppSpacing.sm),
                trailing,
              ],
            );
          }

          return Row(
            children: [
              Expanded(child: leading),
              trailing,
            ],
          );
        },
      ),
    );
  }
}

class _TeamUsageCard extends StatelessWidget {
  const _TeamUsageCard({required this.isId});

  final bool isId;

  @override
  Widget build(BuildContext context) {
    return PremiumSurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isId ? 'Seat dan penggunaan tim' : 'Seats and team usage',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            isId
                ? 'Cek siapa yang aktif dan bagaimana pemakaian workspace per anggota.'
                : 'Check who is active and how workspace usage is distributed.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.lg),
          ...const [
            _MemberUsageRow(name: 'Rani Setiawan', role: 'Owner', usage: '214 draft bulan ini', status: 'AKTIF', tone: AppColors.success),
            _MemberUsageRow(name: 'Aldi Pratama', role: 'Content lead', usage: '166 draft bulan ini', status: 'AKTIF', tone: AppColors.info),
            _MemberUsageRow(name: 'Nadya Kusuma', role: 'Affiliate ops', usage: '91 draft bulan ini', status: 'REVIEW', tone: AppColors.warning),
          ],
        ],
      ),
    );
  }
}

class _MemberUsageRow extends StatelessWidget {
  const _MemberUsageRow({
    required this.name,
    required this.role,
    required this.usage,
    required this.status,
    required this.tone,
  });

  final String name;
  final String role;
  final String usage;
  final String status;
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
      child: LayoutBuilder(
        builder: (context, constraints) {
          final stacked = constraints.maxWidth < 560;

          final identity = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name, style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: AppSpacing.xs),
              Text(role, style: Theme.of(context).textTheme.bodySmall),
            ],
          );
          final usageText = Text(
            usage,
            style: Theme.of(context).textTheme.bodySmall,
          );
          final statusPill = PremiumPill(
            label: status,
            background: tone,
            foreground: Colors.white,
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: 9,
            ),
          );

          if (stacked) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                identity,
                const SizedBox(height: AppSpacing.sm),
                usageText,
                const SizedBox(height: AppSpacing.sm),
                statusPill,
              ],
            );
          }

          return Row(
            children: [
              Expanded(child: identity),
              Expanded(child: usageText),
              const SizedBox(width: AppSpacing.md),
              statusPill,
            ],
          );
        },
      ),
    );
  }
}

class _ActivityCard extends StatelessWidget {
  const _ActivityCard({required this.isId});

  final bool isId;

  @override
  Widget build(BuildContext context) {
    return PremiumSurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isId ? 'Aktivitas pembayaran' : 'Billing activity',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            isId
                ? 'Mutasi terbaru terkait paket, add-on, dan kredit render.'
                : 'Latest movement across plans, add-ons, and render credits.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.lg),
          ...const [
            _ActivityRow(title: 'Renewal paket Growth', time: '27 Mar 2026, 09:42 WIB', amount: '-Rp1.490.000', amountColor: AppColors.danger),
            _ActivityRow(title: 'Top-up kredit render', time: '25 Mar 2026, 16:08 WIB', amount: '-Rp250.000', amountColor: AppColors.warning),
            _ActivityRow(title: 'Refund duplikasi pembayaran', time: '21 Mar 2026, 10:21 WIB', amount: '+Rp250.000', amountColor: AppColors.success),
          ],
        ],
      ),
    );
  }
}

class _ActivityRow extends StatelessWidget {
  const _ActivityRow({
    required this.title,
    required this.time,
    required this.amount,
    required this.amountColor,
  });

  final String title;
  final String time;
  final String amount;
  final Color amountColor;

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
      child: LayoutBuilder(
        builder: (context, constraints) {
          final stacked = constraints.maxWidth < 420;

          final leading = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: AppSpacing.xs),
              Text(time, style: Theme.of(context).textTheme.bodySmall),
            ],
          );
          final trailing = Text(
            amount,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: amountColor,
                ),
          );

          if (stacked) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                leading,
                const SizedBox(height: AppSpacing.sm),
                trailing,
              ],
            );
          }

          return Row(
            children: [
              Expanded(child: leading),
              trailing,
            ],
          );
        },
      ),
    );
  }
}
