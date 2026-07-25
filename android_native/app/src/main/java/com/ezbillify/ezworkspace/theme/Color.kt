package com.ezbillify.ezworkspace.theme

import androidx.compose.ui.graphics.Color

/**
 * EZ-Workspace palette — mirrors the web app and Flutter build's strict
 * palette: blue #3B82F6 · dark #1F2937 · white #FFFFFF.
 */
object AppColors {
    val primary = Color(0xFF3B82F6)
    val primaryDark = Color(0xFF2563EB)
    val primaryLight = Color(0xFF93C5FD)
    val ink = Color(0xFF1F2937)
    val inkSoft = Color(0xFF334155)
    val white = Color(0xFFFFFFFF)

    val scaffold = Color(0xFFEBF1F9) // neumorphic soft background
    val cardFill = Color(0xFFF2F6FC)
    val inputFill = Color(0xFFE4ECF7)

    val muted = ink.copy(alpha = 0.60f)
    val subtle = ink.copy(alpha = 0.42f)
    val border = ink.copy(alpha = 0.08f)

    val success = Color(0xFF16A34A)
    val danger = Color(0xFFEF4444)
    val warning = Color(0xFFF59E0B)
}
