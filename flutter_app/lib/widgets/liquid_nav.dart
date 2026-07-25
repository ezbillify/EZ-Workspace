import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_theme.dart';

class NavDest {
  const NavDest(this.icon, this.label);
  final IconData icon;
  final String label;
}

/// Neumorphic floating bottom navigation bar (neumorphism.io style).
/// Features soft dual-shadow 3D surface with clean tab switching and primary blue accents.
class LiquidNav extends StatelessWidget {
  const LiquidNav({
    super.key,
    required this.index,
    required this.items,
    required this.onTap,
  });

  final int index;
  final List<NavDest> items;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Container(
        height: 68,
        decoration: BoxDecoration(
          color: const Color(0xFFF0F5FC),
          borderRadius: BorderRadius.circular(32),
          boxShadow: NeuDecoration.raised(distance: 6, blur: 16, alpha: 0.5),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        child: Row(
          children: [
            for (int i = 0; i < items.length; i++)
              Expanded(
                child: _NeuTab(
                  dest: items[i],
                  active: i == index,
                  onTap: () {
                    HapticFeedback.selectionClick();
                    onTap(i);
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _NeuTab extends StatelessWidget {
  const _NeuTab({
    required this.dest,
    required this.active,
    required this.onTap,
  });

  final NavDest dest;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(vertical: 6),
        decoration: BoxDecoration(
          color: active ? AppColors.primary.withValues(alpha: 0.12) : Colors.transparent,
          borderRadius: BorderRadius.circular(22),
          boxShadow: active
              ? [
                  BoxShadow(
                    color: Colors.white.withValues(alpha: 0.6),
                    offset: const Offset(-2, -2),
                    blurRadius: 6,
                  ),
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.15),
                    offset: const Offset(2, 2),
                    blurRadius: 6,
                  ),
                ]
              : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              dest.icon,
              size: 22,
              color: active ? AppColors.primary : AppColors.muted,
            ),
            const SizedBox(height: 3),
            Text(
              dest.label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                color: active ? AppColors.primary : AppColors.muted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
