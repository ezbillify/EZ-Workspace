import 'package:supabase_flutter/supabase_flutter.dart';

/// Employee profile loaded from the shared `employees` table.
class AppUser {
  AppUser({
    required this.id,
    required this.name,
    required this.email,
    this.role = 'employee',
    this.designation,
    this.department,
  });

  final String id;
  final String name;
  final String email;
  final String role;
  final String? designation;
  final String? department;

  String get initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }
}

class AuthService {
  final SupabaseClient _sb = Supabase.instance.client;

  Session? get session => _sb.auth.currentSession;
  bool get isLoggedIn => session != null;

  /// Signs in against the SAME Supabase project the web app uses.
  Future<AppUser> signIn(String email, String password) async {
    final clean = email.trim().toLowerCase();
    final res = await _sb.auth.signInWithPassword(email: clean, password: password);
    if (res.user == null) {
      throw const AuthException('Invalid email or password.');
    }
    return await loadProfile() ??
        AppUser(id: res.user!.id, name: _nameFromEmail(clean), email: clean);
  }

  /// Loads the employee profile for the current auth user (RLS-permitting).
  Future<AppUser?> loadProfile() async {
    final u = _sb.auth.currentUser;
    if (u == null) return null;
    final email = (u.email ?? '').toLowerCase();
    try {
      final row = await _sb
          .from('employees')
          .select('id, name, email, role, designation, department')
          .or('email.ilike.$email,personal_email.ilike.$email,zoho_email.ilike.$email')
          .maybeSingle();
      if (row == null) return null;
      return AppUser(
        id: row['id'].toString(),
        name: (row['name'] ?? _nameFromEmail(email)).toString(),
        email: (row['email'] ?? email).toString(),
        role: (row['role'] ?? 'employee').toString(),
        designation: row['designation']?.toString(),
        department: row['department']?.toString(),
      );
    } catch (_) {
      // RLS may block the read — fall back to auth identity so login still works.
      return AppUser(id: u.id, name: _nameFromEmail(email), email: email);
    }
  }

  Future<void> signOut() => _sb.auth.signOut();

  String _nameFromEmail(String email) {
    final local = email.split('@').first.replaceAll(RegExp(r'[._]'), ' ');
    return local
        .split(' ')
        .where((w) => w.isNotEmpty)
        .map((w) => w[0].toUpperCase() + w.substring(1))
        .join(' ');
  }
}
