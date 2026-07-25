package com.ezbillify.ezworkspace.theme

import android.graphics.BlurMaskFilter
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Neumorphism.io-style dual soft-shadow surface — a light shadow (top-left)
 * and a darker shadow (bottom-right) around a flat rounded shape. This is the
 * ONE visual technique the whole app's design language is built on: solid
 * fills, no backdrop blur, no translucency, no continuous animation.
 *
 * Mirrors the Flutter build's `NeuDecoration.raised()/.soft()` box-shadow pairs.
 */
fun Modifier.neumorphic(
    cornerRadius: Dp = 20.dp,
    lightColor: Color = Color.White,
    darkColor: Color = Color(0xFFA6B7CE),
    elevation: Dp = 10.dp,
    offset: Dp = 6.dp,
    fillColor: Color = AppColors.cardFill,
    darkAlpha: Float = 0.55f,
): Modifier = this
    // BlurMaskFilter needs an offscreen compositing layer to render correctly in Compose.
    .graphicsLayer(compositingStrategy = CompositingStrategy.Offscreen)
    .drawBehind {
        val cornerPx = cornerRadius.toPx()
        val elevationPx = elevation.toPx()
        val offsetPx = offset.toPx()

        fun shadow(color: Color, dx: Float, dy: Float) {
            drawIntoCanvas { canvas ->
                val paint = Paint().asFrameworkPaint().apply {
                    isAntiAlias = true
                    this.color = color.toArgb()
                    maskFilter = BlurMaskFilter(elevationPx, BlurMaskFilter.Blur.NORMAL)
                }
                canvas.nativeCanvas.drawRoundRect(
                    dx, dy, size.width + dx, size.height + dy,
                    cornerPx, cornerPx, paint,
                )
            }
        }

        shadow(lightColor.copy(alpha = 0.9f), -offsetPx, -offsetPx)
        shadow(darkColor.copy(alpha = darkAlpha), offsetPx, offsetPx)

        drawRoundRect(
            color = fillColor,
            cornerRadius = CornerRadius(cornerPx, cornerPx),
        )
    }

/** Bigger, more pronounced shadow — cards, the nav bar, the splash logo tile. */
fun Modifier.neumorphicRaised(cornerRadius: Dp = 20.dp, fillColor: Color = AppColors.cardFill) =
    neumorphic(cornerRadius = cornerRadius, elevation = 14.dp, offset = 6.dp, fillColor = fillColor)

/** Smaller, subtler shadow — avatars, chat bubbles, minor surfaces. */
fun Modifier.neumorphicSoft(cornerRadius: Dp = 20.dp, fillColor: Color = AppColors.cardFill) =
    neumorphic(cornerRadius = cornerRadius, elevation = 10.dp, offset = 4.dp, fillColor = fillColor, darkAlpha = 0.45f)
