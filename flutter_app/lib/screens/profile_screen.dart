import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/glass.dart';
import '../services/auth_service.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key, this.user, required this.onLogout});
  final AppUser? user;
  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 110),
      children: [
        Text('Profile',
            style: TextStyle(fontSize: AppTheme.fluid(context, 24, 30), fontWeight: FontWeight.w900, color: AppColors.ink)),
        const SizedBox(height: 16),
        GlassCard(
          child: Row(children: [
            Container(
              width: 60, height: 60,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.12),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
              ),
              alignment: Alignment.center,
              child: Text(user?.initials ?? '?',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.primary)),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(user?.name ?? '—',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: AppColors.ink)),
                  const SizedBox(height: 2),
                  Text(user?.email ?? '—',
                      style: TextStyle(fontSize: 12, color: AppColors.muted)),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(AppRadius.pill),
                    ),
                    child: Text((user?.role ?? 'employee').toUpperCase(),
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.primary)),
                  ),
                ],
              ),
            ),
          ]),
        ),
        const SizedBox(height: 18),
        GlassCard(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Column(children: [
            _row(Icons.notifications_none, 'Notifications'),
            _divider(),
            _row(Icons.lock_outline, 'Security & Privacy'),
            _divider(),
            _row(Icons.help_outline, 'Support & Help'),
            _divider(),
            _row(Icons.info_outline, 'About EZ-Workspace'),
          ]),
        ),
        const SizedBox(height: 18),
        SizedBox(
          height: 52,
          child: OutlinedButton.icon(
            onPressed: onLogout,
            icon: const Icon(Icons.logout, size: 18),
            label: const Text('Log out', style: TextStyle(fontWeight: FontWeight.w800)),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.danger,
              side: BorderSide(color: AppColors.danger.withValues(alpha: 0.4)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
            ),
          ),
        ),
        const SizedBox(height: 14),
        Center(
          child: Text('EZ-Workspace · v1.0.0',
              style: TextStyle(fontSize: 11, color: AppColors.subtle)),
        ),
      ],
    );
  }

  Widget _row(IconData i, String t) => ListTile(
        leading: Icon(i, size: 20, color: AppColors.ink),
        title: Text(t, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.ink)),
        trailing: Icon(Icons.chevron_right, size: 20, color: AppColors.subtle),
        onTap: () {},
      );

  Widget _divider() => Divider(height: 1, color: AppColors.border, indent: 56);
}
