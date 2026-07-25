import 'package:supabase_flutter/supabase_flutter.dart';

/// Live data layer over the SAME Supabase project as the web app.
///
/// Every screen: (1) fetches real rows immediately, and (2) opens a realtime
/// channel so inserts/updates/deletes push instantly. If a table doesn't have
/// Realtime enabled yet, the fetched data still shows and pull-to-refresh works.
class DataService {
  final SupabaseClient _sb = Supabase.instance.client;

  /// Maps a web module label → its Supabase table (discovered from the web app).
  static const Map<String, String> moduleTables = {
    'Projects': 'projects',
    'Employees': 'employees',
    'Teams': 'teams',
    'Org Chart': 'teams',
    'Attendance': 'attendance_logs',
    'My Attendance': 'attendance_logs',
    'Recruitment Hub': 'applications',
    'ATS Scanner': 'applications',
    'Interviews': 'interviews',
    'Onboarding': 'onboarding_packets',
    'Claims': 'claims',
    'Reimbursements': 'reimbursements',
    'Payroll': 'payroll_runs',
    'Payslips': 'payroll_runs',
    'My Payslips': 'payroll_runs',
    'Invoicing': 'invoices',
    'Subscriptions': 'subscriptions',
    'Budgets': 'budgets',
    'Sales Pipeline': 'leads',
    'Clients': 'leads',
    'Mail Hub': 'mail_messages',
    'Inbox': 'mail_messages',
    'Messages': 'mail_messages',
    'Meetings': 'calendar_events',
    'My Calendar': 'calendar_events',
    'Academy': 'lms_courses',
    'Analytics': 'audit_logs',
    'Security & Audit': 'audit_logs',
    'Sessions': 'user_presence',
    'System Config': 'system_config',
  };

  static String? tableFor(String moduleLabel) => moduleTables[moduleLabel];

  /// One-shot fetch of up to [limit] rows.
  Future<List<Map<String, dynamic>>> fetch(String table, {int limit = 50}) async {
    final rows = await _sb.from(table).select().limit(limit);
    return (rows as List).cast<Map<String, dynamic>>();
  }

  /// Exact row count (head request — cheap).
  Future<int> count(String table) async {
    return await _sb.from(table).count(CountOption.exact);
  }

  /// Realtime channel — calls [onChange] on any insert/update/delete.
  RealtimeChannel subscribe(String table, void Function() onChange) {
    final channel = _sb.channel('rt:$table:${DateTime.now().microsecondsSinceEpoch}');
    channel
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: table,
          callback: (_) => onChange(),
        )
        .subscribe();
    return channel;
  }

  void unsubscribe(RealtimeChannel? channel) {
    if (channel != null) _sb.removeChannel(channel);
  }

  // ── Generic display helpers (schema-agnostic) ──
  static String title(Map row) {
    for (final k in ['name', 'title', 'subject', 'full_name', 'label',
        'company_name', 'file_name', 'course_name', 'email', 'action']) {
      final v = row[k];
      if (v != null && v.toString().trim().isNotEmpty) return v.toString();
    }
    for (final e in row.entries) {
      if (e.key != 'id' && e.value is String && (e.value as String).trim().isNotEmpty) {
        return e.value.toString();
      }
    }
    return row['id']?.toString() ?? '—';
  }

  static String subtitle(Map row) {
    for (final k in ['status', 'stage', 'designation', 'department', 'role',
        'type', 'category', 'email', 'created_at', 'date']) {
      final v = row[k];
      if (v != null && v.toString().trim().isNotEmpty) {
        return k == 'created_at' || k == 'date' ? _date(v.toString()) : v.toString();
      }
    }
    return '';
  }

  static String _date(String iso) {
    final d = DateTime.tryParse(iso);
    if (d == null) return iso;
    return '${d.day}/${d.month}/${d.year}';
  }
}
