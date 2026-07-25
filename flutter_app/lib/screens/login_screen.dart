import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/glass.dart';
import '../services/auth_service.dart';
import 'dashboard_shell.dart';

/// Responsive glassmorphism login — single column on phones, 60/40 split on
/// tablets/landscape. Auto-sizes to any device. Wired to Supabase Auth.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _auth = AuthService();
  bool _obscure = true;
  bool _loading = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_email.text.trim().isEmpty || _password.text.isEmpty) {
      _toast('Enter your email and password.', error: true);
      return;
    }
    setState(() => _loading = true);
    try {
      await _auth.signIn(_email.text, _password.text);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const DashboardShell()),
      );
    } catch (e) {
      _toast(_message(e), error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _message(Object e) {
    final s = e.toString();
    if (s.contains('Invalid login') || s.contains('invalid')) {
      return 'Invalid email or password.';
    }
    return s.replaceFirst('AuthException: ', '').replaceFirst('Exception: ', '');
  }

  void _toast(String msg, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: error ? AppColors.danger : AppColors.ink,
      behavior: SnackBarBehavior.floating,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final wide = AppTheme.isWide(context);
    return Scaffold(
      body: GlassBackground(
        child: SafeArea(
          child: wide
              ? Row(children: [
                  Expanded(flex: 6, child: _brandPanel(context)),
                  Expanded(flex: 4, child: Center(child: _formArea(context))),
                ])
              : Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(vertical: 24),
                    child: _formArea(context, showLogo: true),
                  ),
                ),
        ),
      ),
    );
  }

  Widget _formArea(BuildContext context, {bool showLogo = false}) {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 420),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (showLogo) ...[
              _logoTile(64),
              const SizedBox(height: 14),
              Text('EZ-Workspace',
                  style: TextStyle(
                    fontSize: AppTheme.fluid(context, 22, 30),
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                    color: AppColors.ink,
                  )),
              const SizedBox(height: 4),
              Text('ENTERPRISE OPERATIONS PANEL',
                  style: TextStyle(
                    fontSize: 10, fontWeight: FontWeight.w700,
                    letterSpacing: 2.5, color: AppColors.muted,
                  )),
              const SizedBox(height: 22),
            ],
            GlassCard(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Internal Sign In',
                      style: TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w900,
                        letterSpacing: 0.4, color: AppColors.ink,
                      )),
                  const SizedBox(height: 4),
                  Text('Access your operations dashboard',
                      style: TextStyle(fontSize: 12, color: AppColors.muted)),
                  const SizedBox(height: 22),
                  _label('CORPORATE EMAIL'),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.email],
                    decoration: glassField(hint: 'name@ezbillify.in', icon: Icons.mail_outline),
                  ),
                  const SizedBox(height: 16),
                  _label('SECURITY PASSWORD'),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _password,
                    obscureText: _obscure,
                    onSubmitted: (_) => _submit(),
                    decoration: glassField(
                      hint: '••••••••',
                      icon: Icons.lock_outline,
                      suffix: IconButton(
                        icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                            size: 18, color: AppColors.muted),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      ),
                    ),
                  ),
                  const SizedBox(height: 22),
                  _primaryButton(),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Forgot credentials?',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.muted)),
                      _chip(Icons.verified_user_outlined, 'Secure'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            Text('© ${DateTime.now().year} EZBillify Ventures Pvt Ltd · AGPL-3.0',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w500, color: AppColors.subtle)),
          ],
        ),
      ),
    );
  }

  Widget _primaryButton() {
    return Container(
      height: 52,
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(AppRadius.md),
        boxShadow: [
          const BoxShadow(
            color: Colors.white,
            offset: Offset(-4, -4),
            blurRadius: 10,
          ),
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.5),
            offset: const Offset(4, 4),
            blurRadius: 10,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _loading ? null : _submit,
          borderRadius: BorderRadius.circular(AppRadius.md),
          child: Center(
            child: _loading
                ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('AUTHORIZE ACCESS',
                          style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5, fontSize: 12, color: Colors.white)),
                      SizedBox(width: 8),
                      Icon(Icons.arrow_forward, size: 16, color: Colors.white),
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  Widget _label(String s) => Text(s,
      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8, color: AppColors.muted));

  Widget _chip(IconData icon, String s) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(AppRadius.pill),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 13, color: AppColors.primary),
          const SizedBox(width: 5),
          Text(s, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.primary)),
        ]),
      );

  Widget _logoTile(double s) => Container(
        width: s, height: s,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.35), blurRadius: 28, offset: const Offset(0, 12))],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Image.asset('assets/images/logo.png', fit: BoxFit.cover),
        ),
      );

  // Dark brand panel for tablets / landscape.
  Widget _brandPanel(BuildContext context) {
    Widget feature(IconData i, String t) => Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: Row(children: [
            Container(
              width: 38, height: 38,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(i, size: 18, color: AppColors.primaryLight),
            ),
            const SizedBox(width: 12),
            Expanded(child: Text(t, style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.85)))),
          ]),
        );

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(36),
      decoration: BoxDecoration(
        color: AppColors.ink,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        boxShadow: [BoxShadow(color: AppColors.ink.withValues(alpha: 0.3), blurRadius: 40, offset: const Offset(0, 20))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(children: [
            _logoTile(44),
            const SizedBox(width: 12),
            const Text('EZ-Workspace',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white)),
          ]),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Run your entire company\nfrom one secure panel.',
                  style: TextStyle(
                    fontSize: AppTheme.fluid(context, 26, 40),
                    height: 1.05, fontWeight: FontWeight.w900, color: Colors.white,
                  )),
              const SizedBox(height: 24),
              feature(Icons.verified_user_outlined, 'Bank-grade security & full audit trails'),
              feature(Icons.apartment_outlined, 'HR, finance & operations unified'),
              feature(Icons.insights_outlined, 'Real-time insights across every team'),
            ],
          ),
          Row(children: [
            Icon(Icons.shield_outlined, size: 14, color: AppColors.primaryLight),
            const SizedBox(width: 6),
            Text('Encrypted · SSO-ready · Audit-logged',
                style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.45))),
          ]),
        ],
      ),
    );
  }
}
