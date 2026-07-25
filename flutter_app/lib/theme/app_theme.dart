import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// EZ-Workspace design system — mirrors the web app's strict palette:
/// blue #3B82F6 · dark #1F2937 · white #FFFFFF, Inter typography, glassmorphism.
class AppColors {
  static const Color primary = Color(0xFF3B82F6); // blue
  static const Color primaryDark = Color(0xFF2563EB); // blue-600
  static const Color primaryLight = Color(0xFF93C5FD); // blue-300
  static const Color ink = Color(0xFF1F2937); // "black"
  static const Color inkSoft = Color(0xFF334155);
  static const Color white = Color(0xFFFFFFFF);

  static const Color scaffold = Color(0xFFEBF1F9); // Neumorphic soft background
  static Color border = ink.withValues(alpha: 0.08);
  static Color muted = ink.withValues(alpha: 0.60);
  static Color subtle = ink.withValues(alpha: 0.42);

  // Semantic (kept, like the web app)
  static const Color success = Color(0xFF16A34A);
  static const Color danger = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
}

/// Neumorphism UI shadow & decoration helpers (neumorphism.io style)
class NeuDecoration {
  static const Color background = Color(0xFFEBF1F9);
  static const Color cardFill = Color(0xFFF2F6FC);
  static const Color darkShadow = Color(0xFFA6B7CE);
  static const Color lightShadow = Color(0xFFFFFFFF);

  static List<BoxShadow> raised({double distance = 6, double blur = 14, double alpha = 0.55}) {
    return [
      const BoxShadow(
        color: lightShadow,
        offset: Offset(-6, -6),
        blurRadius: 14,
      ),
      BoxShadow(
        color: darkShadow.withValues(alpha: alpha),
        offset: const Offset(6, 6),
        blurRadius: 14,
      ),
    ];
  }

  static List<BoxShadow> soft({double distance = 4, double blur = 10, double alpha = 0.45}) {
    return [
      const BoxShadow(
        color: lightShadow,
        offset: Offset(-4, -4),
        blurRadius: 10,
      ),
      BoxShadow(
        color: darkShadow.withValues(alpha: alpha),
        offset: const Offset(4, 4),
        blurRadius: 10,
      ),
    ];
  }
}

class AppRadius {
  static const double sm = 10;
  static const double md = 14;
  static const double lg = 20;
  static const double xl = 28;
  static const double pill = 999;
}

class AppTheme {
  static ThemeData light() {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        primary: AppColors.primary,
        onPrimary: AppColors.white,
        surface: NeuDecoration.cardFill,
        onSurface: AppColors.ink,
        brightness: Brightness.light,
      ),
      scaffoldBackgroundColor: AppColors.scaffold,
      splashFactory: InkRipple.splashFactory,
    );

    return base.copyWith(
      textTheme: GoogleFonts.interTextTheme(base.textTheme).apply(
        bodyColor: AppColors.ink,
        displayColor: AppColors.ink,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        foregroundColor: AppColors.ink,
      ),
    );
  }

  /// Fluid font size — scales with device width like the web app's clamp().
  static double fluid(BuildContext context, double min, double max) {
    final w = MediaQuery.sizeOf(context).width;
    final t = ((w - 340) / (1024 - 340)).clamp(0.0, 1.0);
    return (min + (max - min) * t);
  }

  static bool isWide(BuildContext context) =>
      MediaQuery.sizeOf(context).width >= 820;
}
