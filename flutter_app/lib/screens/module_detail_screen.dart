import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/glass.dart';
import '../widgets/live_list.dart';
import '../data/modules.dart';
import '../services/data_service.dart';

/// Module screen — shows LIVE Supabase data (realtime) when the module maps to
/// a table; otherwise a connected placeholder for hub-style modules.
class ModuleDetailScreen extends StatelessWidget {
  const ModuleDetailScreen({super.key, required this.module});
  final ModuleItem module;

  @override
  Widget build(BuildContext context) {
    final table = DataService.tableFor(module.label);
    return Scaffold(
      body: GlassBackground(
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 8, 16, 8),
                child: Row(children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back),
                    color: AppColors.ink,
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  Icon(module.icon, size: 20, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(module.label,
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.ink)),
                  ),
                ]),
              ),
              Expanded(
                child: table != null
                    ? LiveList(table: table, icon: module.icon)
                    : _placeholder(context),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _placeholder(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: GlassCard(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72, height: 72,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Icon(module.icon, size: 34, color: AppColors.primary),
              ),
              const SizedBox(height: 18),
              Text(module.label,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.ink)),
              const SizedBox(height: 8),
              Text(
                'This hub aggregates several live modules. Open its sections from the Modules tab to see realtime data.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, height: 1.4, color: AppColors.muted),
              ),
              const SizedBox(height: 18),
              _chip(Icons.sync, 'Connected to Supabase'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _chip(IconData i, String t) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(AppRadius.pill),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(i, size: 14, color: AppColors.primary),
          const SizedBox(width: 6),
          Text(t, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.primary)),
        ]),
      );
}
