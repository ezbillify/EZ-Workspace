import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Small persistence helper. Stores the floating EZ AI orb position as
/// screen fractions (0..1) so it survives app restarts and adapts to any size.
class Prefs {
  static const _kx = 'orb_frac_x';
  static const _ky = 'orb_frac_y';

  static Future<Offset?> loadOrb() async {
    final p = await SharedPreferences.getInstance();
    if (!p.containsKey(_kx) || !p.containsKey(_ky)) return null;
    return Offset(p.getDouble(_kx)!, p.getDouble(_ky)!);
  }

  static Future<void> saveOrb(Offset frac) async {
    final p = await SharedPreferences.getInstance();
    await p.setDouble(_kx, frac.dx);
    await p.setDouble(_ky, frac.dy);
  }

  /// Clears saved position — used on logout so it re-centers on next login.
  static Future<void> clearOrb() async {
    final p = await SharedPreferences.getInstance();
    await p.remove(_kx);
    await p.remove(_ky);
  }
}
