import 'package:flutter/material.dart';
import '../widgets/glass.dart';
import '../widgets/liquid_nav.dart';
import '../widgets/draggable_ai_orb.dart';
import '../services/auth_service.dart';
import '../services/prefs.dart';
import 'dashboard_screen.dart';
import 'modules_screen.dart';
import 'ez_ai_screen.dart';
import 'activity_screen.dart';
import 'profile_screen.dart';
import 'login_screen.dart';

/// App shell — Liquid Glass floating nav + a free-floating, draggable EZ AI orb.
class DashboardShell extends StatefulWidget {
  const DashboardShell({super.key});

  @override
  State<DashboardShell> createState() => _DashboardShellState();
}

class _DashboardShellState extends State<DashboardShell> {
  int _index = 0;
  AppUser? _user;
  final _auth = AuthService();

  static const _nav = [
    NavDest(Icons.grid_view_rounded, 'Home'),
    NavDest(Icons.widgets_outlined, 'Modules'),
    NavDest(Icons.bar_chart_rounded, 'Activity'),
    NavDest(Icons.person_outline, 'Profile'),
  ];

  @override
  void initState() {
    super.initState();
    _auth.loadProfile().then((u) {
      if (mounted) setState(() => _user = u);
    });
  }

  Future<void> _logout() async {
    await Prefs.clearOrb(); // re-center the orb on next login
    await _auth.signOut();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  void _openEzAi() {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => const Scaffold(
        body: GlassBackground(child: SafeArea(child: EzAiScreen())),
      ),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      DashboardScreen(user: _user),
      const ModulesScreen(),
      const ActivityScreen(),
      ProfileScreen(user: _user, onLogout: _logout),
    ];

    return Scaffold(
      extendBody: true,
      body: Stack(
        children: [
          GlassBackground(
            child: SafeArea(bottom: false, child: IndexedStack(index: _index, children: pages)),
          ),
          // Liquid Glass floating nav
          Positioned(
            left: 0, right: 0, bottom: 0,
            child: SafeArea(
              top: false,
              child: LiquidNav(
                index: _index,
                items: _nav,
                onTap: (i) => setState(() => _index = i),
              ),
            ),
          ),
          // Free-floating, draggable EZ AI ball (tap → EZ AI, long-press → drag)
          DraggableAiOrb(onTap: _openEzAi),
        ],
      ),
    );
  }
}
