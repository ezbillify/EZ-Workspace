import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_theme.dart';
import '../services/data_service.dart';
import 'glass.dart';

/// Renders real rows from a Supabase [table] and live-updates via realtime.
class LiveList extends StatefulWidget {
  const LiveList({super.key, required this.table, required this.icon, this.limit = 50});
  final String table;
  final IconData icon;
  final int limit;

  @override
  State<LiveList> createState() => _LiveListState();
}

class _LiveListState extends State<LiveList> {
  final _svc = DataService();
  RealtimeChannel? _channel;
  List<Map<String, dynamic>>? _rows;
  String? _error;
  bool _live = false;

  @override
  void initState() {
    super.initState();
    _load();
    _channel = _svc.subscribe(widget.table, () {
      _live = true;
      _load();
    });
  }

  @override
  void dispose() {
    _svc.unsubscribe(_channel);
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final rows = await _svc.fetch(widget.table, limit: widget.limit);
      if (!mounted) return;
      setState(() {
        _rows = rows;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) return _state(Icons.lock_outline, 'Restricted', 'This table isn\'t readable for your role yet.');
    if (_rows == null) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }
    if (_rows!.isEmpty) return _state(widget.icon, 'No records', 'Nothing here yet — new rows appear instantly.');

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
        itemCount: _rows!.length + 1,
        separatorBuilder: (_, i) => i == 0 ? const SizedBox.shrink() : const SizedBox(height: 8),
        itemBuilder: (context, i) {
          if (i == 0) return _liveHeader();
          final row = _rows![i - 1];
          return _rowCard(row);
        },
      ),
    );
  }

  Widget _liveHeader() => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Row(children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppRadius.pill),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Container(width: 7, height: 7, decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
              const SizedBox(width: 6),
              Text(_live ? 'LIVE · updated' : 'LIVE',
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.primary)),
            ]),
          ),
          const Spacer(),
          Text('${_rows!.length} records', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.muted)),
        ]),
      );

  Widget _rowCard(Map<String, dynamic> row) {
    final title = DataService.title(row);
    final sub = DataService.subtitle(row);
    return GlassCard(
      padding: const EdgeInsets.all(12),
      radius: AppRadius.md,
      opacity: 0.55,
      child: Row(children: [
        Container(
          width: 40, height: 40,
          decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
          child: Icon(widget.icon, size: 19, color: AppColors.primary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.ink)),
              if (sub.isNotEmpty)
                Text(sub, maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 11, color: AppColors.muted)),
            ],
          ),
        ),
      ]),
    );
  }

  Widget _state(IconData icon, String title, String msg) => Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: GlassCard(
            padding: const EdgeInsets.all(26),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(icon, size: 40, color: AppColors.primary),
              const SizedBox(height: 14),
              Text(title, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: AppColors.ink)),
              const SizedBox(height: 6),
              Text(msg, textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: AppColors.muted)),
            ]),
          ),
        ),
      );
}
