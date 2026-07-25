package com.ezbillify.ezworkspace.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val EzColorScheme = lightColorScheme(
    primary = AppColors.primary,
    onPrimary = AppColors.white,
    background = AppColors.scaffold,
    surface = AppColors.cardFill,
    onBackground = AppColors.ink,
    onSurface = AppColors.ink,
    error = AppColors.danger,
)

@Composable
fun EZWorkspaceTheme(content: @Composable () -> Unit) {
    // Neumorphism is a fixed light, flat surface language — no dark-mode inversion.
    MaterialTheme(
        colorScheme = EzColorScheme,
        typography = ezTypography(AppColors.ink),
        content = content,
    )
}
