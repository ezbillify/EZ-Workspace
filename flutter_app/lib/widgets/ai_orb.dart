import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// The "EZ AI" sphere — a static 3D-shaded gradient orb with a soft ambient
/// glow, matching the neumorphism.io design system. No motion/animation.
class AiOrb extends StatelessWidget {
  const AiOrb({super.key, this.size = 40});
  final double size;

  @override
  Widget build(BuildContext context) {
    final s = size;
    return SizedBox(
      width: s * 1.5,
      height: s * 1.5,
      child: Center(
        child: Container(
          width: s,
          height: s,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const RadialGradient(
              center: Alignment(-0.35, -0.4),
              radius: 1.05,
              colors: [
                Color(0xFF93C5FD),
                Color(0xFF60A5FA),
                Color(0xFF3B82F6),
                Color(0xFF1D4ED8),
              ],
              stops: [0.0, 0.3, 0.7, 1.0],
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.45),
                blurRadius: 22,
                spreadRadius: 2,
              ),
              BoxShadow(
                color: const Color(0xFF1D4ED8).withValues(alpha: 0.35),
                blurRadius: 12,
                offset: const Offset(2, 5),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
