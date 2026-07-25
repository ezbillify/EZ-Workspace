import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/glass.dart';
import '../data/modules.dart';
import 'module_detail_screen.dart';

class ModulesScreen extends StatefulWidget {
  const ModulesScreen({super.key});
  @override
  State<ModulesScreen> createState() => _ModulesScreenState();
}

class _ModulesScreenState extends State<ModulesScreen> {
  String _q = '';

  @override
  Widget build(BuildContext context) {
    final q = _q.trim().toLowerCase();
    final sections = q.isEmpty
        ? kModules
        : kModules
            .map((s) => ModuleSection(
                s.title, s.items.where((i) => i.label.toLowerCase().contains(q)).toList()))
            .where((s) => s.items.isNotEmpty)
            .toList();

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Modules',
                    style: TextStyle(
                      fontSize: AppTheme.fluid(context, 24, 30),
                      fontWeight: FontWeight.w900, color: AppColors.ink)),
                const SizedBox(height: 12),
                TextField(
                  onChanged: (v) => setState(() => _q = v),
                  decoration: glassField(hint: 'Search modules…', icon: Icons.search),
                ),
              ],
            ),
          ),
        ),
        for (final s in sections) ...[
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(22, 14, 20, 8),
              child: Text(s.title.toUpperCase(),
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1, color: AppColors.muted)),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            sliver: SliverList.separated(
              itemCount: s.items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, i) => _tile(context, s.items[i]),
            ),
          ),
        ],
        const SliverToBoxAdapter(child: SizedBox(height: 110)),
      ],
    );
  }

  Widget _tile(BuildContext context, ModuleItem m) {
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => ModuleDetailScreen(module: m)),
      ),
      child: GlassCard(
        padding: const EdgeInsets.all(12),
        radius: AppRadius.md,
        opacity: 0.55,
        child: Row(children: [
          Container(
            width: 38, height: 38,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(m.icon, size: 19, color: AppColors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(m.label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.ink))),
          Icon(Icons.chevron_right, size: 20, color: AppColors.subtle),
        ]),
      ),
    );
  }
}
