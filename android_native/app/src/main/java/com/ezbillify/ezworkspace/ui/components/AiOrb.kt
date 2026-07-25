package com.ezbillify.ezworkspace.ui.components

import android.graphics.BlurMaskFilter
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * The "EZ AI" sphere — a static 3D-shaded gradient orb with a soft ambient
 * glow. No motion/animation, matching the neumorphism.io design language.
 */
@Composable
fun AiOrb(size: Dp = 40.dp, modifier: Modifier = Modifier) {
    val blurRadiusPx = with(LocalDensity.current) { (size * 0.35f).toPx() }
    Box(
        modifier = modifier.size(size * 1.5f),
        contentAlignment = Alignment.Center,
    ) {
        // Soft ambient glow behind the sphere (blurred, no visible shape edge)
        Box(
            modifier = Modifier
                .size(size)
                .graphicsLayer(compositingStrategy = CompositingStrategy.Offscreen)
                .drawBehind {
                    drawIntoCanvas { canvas ->
                        val paint = Paint().asFrameworkPaint().apply {
                            isAntiAlias = true
                            color = Color(0xFF3B82F6).copy(alpha = 0.45f).toArgb()
                            maskFilter = BlurMaskFilter(blurRadiusPx, BlurMaskFilter.Blur.NORMAL)
                        }
                        canvas.nativeCanvas.drawCircle(
                            this.size.width / 2f, this.size.height / 2f,
                            this.size.minDimension / 2f, paint,
                        )
                    }
                },
        )
        // Sphere body — radial gradient for 3D shading
        Box(
            modifier = Modifier
                .size(size)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            Color(0xFF93C5FD),
                            Color(0xFF60A5FA),
                            Color(0xFF3B82F6),
                            Color(0xFF1D4ED8),
                        ),
                    ),
                ),
        )
    }
}
