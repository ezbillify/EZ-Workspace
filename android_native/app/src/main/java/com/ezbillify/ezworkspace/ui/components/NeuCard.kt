package com.ezbillify.ezworkspace.ui.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.ezbillify.ezworkspace.theme.AppColors
import com.ezbillify.ezworkspace.theme.neumorphicRaised

/** A soft 3D Neumorphic card surface (neumorphism.io style) — 1:1 with the Flutter build's GlassCard/NeuCard. */
@Composable
fun NeuCard(
    modifier: Modifier = Modifier,
    padding: PaddingValues = PaddingValues(20.dp),
    radius: Dp = 28.dp,
    fillColor: Color = AppColors.cardFill,
    content: @Composable () -> Unit,
) {
    Box(
        modifier = modifier
            .neumorphicRaised(cornerRadius = radius, fillColor = fillColor)
            .padding(padding),
    ) {
        content()
    }
}
