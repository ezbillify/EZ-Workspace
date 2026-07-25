import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/glass.dart';
import '../services/auth_service.dart';
import 'login_screen.dart';
import 'dashboard_shell.dart';

/// Cinematic 3-second brand intro, then routes to login or dashboard.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 2600))..forward();

  @override
  void initState() {
    super.initState();
    _go();
  }

  Future<void> _go() async {
    await Future.delayed(const Duration(seconds: 3));
    if (!mounted) return;
    final loggedIn = AuthService().isLoggedIn;
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 550),
        pageBuilder: (_, __, ___) =>
            loggedIn ? const DashboardShell() : const LoginScreen(),
        transitionsBuilder: (_, a, __, child) =>
            FadeTransition(opacity: a, child: child),
      ),
    );
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final logoIn = CurvedAnimation(parent: _c, curve: const Interval(0.0, 0.6, curve: Curves.easeOutCubic));
    final textIn = CurvedAnimation(parent: _c, curve: const Interval(0.45, 1.0, curve: Curves.easeOut));

    return Scaffold(
      body: GlassBackground(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedBuilder(
                animation: _c,
                builder: (context, _) {
                  return Transform.scale(
                    scale: 0.6 + 0.4 * logoIn.value,
                    child: Opacity(
                      opacity: logoIn.value.clamp(0.0, 1.0),
                      child: Container(
                        width: 116,
                        height: 116,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF2F6FC),
                          borderRadius: BorderRadius.circular(30),
                          boxShadow: NeuDecoration.raised(distance: 6, blur: 16, alpha: 0.5),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(30),
                          child: Image.asset('assets/images/logo.png',
                              fit: BoxFit.cover),
                        ),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 26),
              FadeTransition(
                opacity: textIn,
                child: SlideTransition(
                  position: Tween(begin: const Offset(0, 0.4), end: Offset.zero)
                      .animate(textIn),
                  child: Column(
                    children: [
                      Text('EZ-Workspace',
                          style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.5,
                            color: AppColors.ink,
                          )),
                      const SizedBox(height: 6),
                      Text('ENTERPRISE OPERATIONS PANEL',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 3,
                            color: AppColors.muted,
                          )),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 44),
              FadeTransition(
                opacity: textIn,
                child: SizedBox(
                  width: 34,
                  height: 34,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.6,
                    valueColor: AlwaysStoppedAnimation(AppColors.primary),
                    backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
