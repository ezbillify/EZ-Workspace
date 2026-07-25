import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// A soft 3D Neumorphic card surface (neumorphism.io style) with dual soft shadows.
class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.radius = AppRadius.xl,
    this.blur = 22,
    this.opacity = 1.0,
    this.border = false,
    this.margin,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;
  final double blur;
  final double opacity;
  final bool border;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: margin ?? EdgeInsets.zero,
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFF2F6FC),
          borderRadius: BorderRadius.circular(radius),
          boxShadow: NeuDecoration.raised(distance: 6, blur: 14, alpha: 0.5),
        ),
        child: Padding(padding: padding, child: child),
      ),
    );
  }
}

/// Alias for Neumorphic Card
class NeuCard extends GlassCard {
  const NeuCard({
    super.key,
    required super.child,
    super.padding,
    super.radius,
    super.margin,
  });
}

/// Full-screen corporate Neumorphic background surface: multi-stop gradient blending pure white
/// into soft corporate light-blue tones, providing contrast for dual-shadow 3D Neumorphic elements.
class GlassBackground extends StatelessWidget {
  const GlassBackground({super.key, required this.child, this.dark = false});
  final Widget child;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: dark
              ? const [Color(0xFF1E293B), Color(0xFF0F172A), Color(0xFF111827)]
              : const [
                  Color(0xFFFFFFFF),
                  Color(0xFFF4F8FE),
                  Color(0xFFEBF2FD),
                  Color(0xFFF0F5FC),
                ],
          stops: const [0.0, 0.35, 0.70, 1.0],
        ),
      ),
      child: child,
    );
  }
}

/// Inset Neumorphic input field styling.
InputDecoration glassField({
  required String hint,
  required IconData icon,
  Widget? suffix,
}) {
  OutlineInputBorder b(Color c, [double w = 1]) => OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: c, width: w),
      );
  return InputDecoration(
    hintText: hint,
    hintStyle: TextStyle(color: AppColors.ink.withValues(alpha: 0.4), fontWeight: FontWeight.w500),
    prefixIcon: Icon(icon, size: 18, color: AppColors.primary),
    suffixIcon: suffix,
    filled: true,
    fillColor: const Color(0xFFE4ECF7),
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
    enabledBorder: b(Colors.white.withValues(alpha: 0.8)),
    focusedBorder: b(AppColors.primary, 1.6),
    errorBorder: b(AppColors.danger),
    focusedErrorBorder: b(AppColors.danger, 1.6),
  );
}
