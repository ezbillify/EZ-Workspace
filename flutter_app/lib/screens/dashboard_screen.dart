import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_theme.dart';
import '../widgets/glass.dart';
import '../services/auth_service.dart';
import '../services/data_service.dart';
import '../data/modules.dart';
import 'module_detail_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key, this.user});
  final AppUser? user;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _svc = DataService();
  final List<RealtimeChannel> _channels = [];

  // label → (table, icon, count)
  final _stats = <String, _Stat>{
    'Employees': _Stat('employees', Icons.badge_outlined),
    'Projects': _Stat('projects', Icons.folder_outlined),
    'Applicants': _Stat('applications', Icons.work_outline),
    'Alerts': _Stat('system_notifications', Icons.notifications_none),
  };

  @override
  void initState() {
    super.initState();
    _loadAll();
    for (final s in _stats.values) {
      _channels.add(_svc.subscribe(s.table, _loadAll));
    }
  }

  @override
  void dispose() {
    for (final c in _channels) {
      _svc.unsubscribe(c);
    }
    super.dispose();
  }

  Future<void> _loadAll() async {
    for (final entry in _stats.entries) {
      try {
        final c = await _svc.count(entry.value.table);
        if (!mounted) return;
        setState(() => entry.value.count = c);
      } catch (_) {
        if (mounted) setState(() => entry.value.count = -1);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.user?.name.split(' ').first ?? 'there';
    final quick = kModules.expand((s) => s.items).where((m) => DataService.tableFor(m.label) != null).take(8).toList();

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _loadAll,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 130),
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Welcome back,', style: TextStyle(fontSize: 13, color: AppColors.muted)),
                    Text(name,
                        style: TextStyle(
                          fontSize: AppTheme.fluid(context, 24, 32),
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.5,
                          color: AppColors.ink,
                        )),
                  ],
                ),
              ),
              _avatar(),
            ],
          ),
          const SizedBox(height: 20),
          _statGrid(),
          const SizedBox(height: 24),
          Text('Quick access',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, letterSpacing: 0.4, color: AppColors.ink)),
          const SizedBox(height: 12),
          LayoutBuilder(builder: (context, c) {
            final cols = c.maxWidth > 640 ? 4 : c.maxWidth > 440 ? 3 : 2;
            return GridView.count(
              crossAxisCount: cols,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.05,
              children: [for (final m in quick) _quickTile(context, m)],
            );
          }),
        ],
      ),
    );
  }

  Widget _avatar() => Container(
        width: 46, height: 46,
        decoration: BoxDecoration(
          color: const Color(0xFFF0F5FC),
          shape: BoxShape.circle,
          boxShadow: NeuDecoration.soft(distance: 4, blur: 10),
        ),
        alignment: Alignment.center,
        child: Text(widget.user?.initials ?? '?',
            style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.primary)),
      );

  Widget _statGrid() {
    final items = _stats.entries.toList();
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.9,
      children: [
        for (final e in items) _statCard(e.key, e.value),
      ],
    );
  }

  Widget _statCard(String label, _Stat s) {
    final v = s.count == null ? '…' : s.count == -1 ? '—' : '${s.count}';
    return GlassCard(
      padding: const EdgeInsets.all(16),
      radius: AppRadius.lg,
      child: Row(
        children: [
          Container(
            width: 42, height: 42,
            decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
            child: Icon(s.icon, size: 20, color: AppColors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(v, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppColors.ink, height: 1.1)),
                Text(label, style: TextStyle(fontSize: 11, color: AppColors.muted)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _quickTile(BuildContext context, ModuleItem m) {
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => ModuleDetailScreen(module: m)),
      ),
      child: GlassCard(
        padding: const EdgeInsets.all(14),
        radius: AppRadius.lg,
        opacity: 0.55,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
              child: Icon(m.icon, size: 20, color: AppColors.primary),
            ),
            const Spacer(),
            Text(m.label, maxLines: 2, overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.ink)),
          ],
        ),
      ),
    );
  }
}

class _Stat {
  _Stat(this.table, this.icon);
  final String table;
  final IconData icon;
  int? count;
}
