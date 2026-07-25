import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/prefs.dart';
import 'ai_orb.dart';

/// A free-floating EZ AI ball. Long-press to pick it up and drag it anywhere;
/// where you drop it is remembered across app restarts. Tap opens EZ AI.
/// Renders as a [Positioned] — place it directly inside a full-screen [Stack].
class DraggableAiOrb extends StatefulWidget {
  const DraggableAiOrb({super.key, required this.onTap});
  final VoidCallback onTap;

  static const double box = 58; // footprint incl. glow
  static const Offset defaultFrac = Offset(0.5, 0.80);

  @override
  State<DraggableAiOrb> createState() => _DraggableAiOrbState();
}

class _DraggableAiOrbState extends State<DraggableAiOrb> {
  Offset? _frac;
  bool _dragging = false;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    Prefs.loadOrb().then((f) {
      if (mounted) {
        setState(() {
          _frac = f ?? DraggableAiOrb.defaultFrac;
          _loaded = true;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_loaded) return const SizedBox.shrink();

    final media = MediaQuery.of(context);
    final size = media.size;
    const b = DraggableAiOrb.box;
    final frac = _frac!;

    final topSafe = media.padding.top + 6;
    final bottomSafe = media.padding.bottom + 6;
    final left = (frac.dx * size.width - b / 2).clamp(6.0, size.width - b - 6.0);
    final top = (frac.dy * size.height - b / 2).clamp(topSafe, size.height - b - bottomSafe);

    return AnimatedPositioned(
      duration: _dragging ? Duration.zero : const Duration(milliseconds: 260),
      curve: Curves.easeOutCubic,
      left: left,
      top: top,
      width: b,
      height: b,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: widget.onTap,
        onPanStart: (_) {
          HapticFeedback.lightImpact();
          setState(() => _dragging = true);
        },
        onPanUpdate: (d) {
          setState(() {
            _frac = Offset(
              (d.globalPosition.dx / size.width).clamp(0.0, 1.0),
              (d.globalPosition.dy / size.height).clamp(0.0, 1.0),
            );
          });
        },
        onPanEnd: (_) {
          setState(() => _dragging = false);
          if (_frac != null) Prefs.saveOrb(_frac!);
        },
        onLongPressStart: (_) {
          HapticFeedback.mediumImpact();
          setState(() => _dragging = true);
        },
        onLongPressMoveUpdate: (d) {
          setState(() {
            _frac = Offset(
              (d.globalPosition.dx / size.width).clamp(0.0, 1.0),
              (d.globalPosition.dy / size.height).clamp(0.0, 1.0),
            );
          });
        },
        onLongPressEnd: (_) {
          setState(() => _dragging = false);
          if (_frac != null) Prefs.saveOrb(_frac!);
        },
        child: AnimatedScale(
          duration: const Duration(milliseconds: 200),
          scale: _dragging ? 1.18 : 1.0,
          child: Center(child: AiOrb(size: _dragging ? 44 : 38)),
        ),
      ),
    );
  }
}
