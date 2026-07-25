package com.ezbillify.ezworkspace.ui.components

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.ezbillify.ezworkspace.services.Prefs
import kotlinx.coroutines.launch

private val boxSize = 58.dp
private const val DEFAULT_FRAC_X = 0.5f
private const val DEFAULT_FRAC_Y = 0.80f

/**
 * A free-floating EZ AI ball. Long-press-drag to pick it up and move it
 * anywhere; where you drop it is remembered across app restarts. Tap opens
 * EZ AI. Place directly inside a full-screen [Box] (parent must report its
 * size via [containerSize], obtained from [rememberContainerSize]).
 */
@Composable
fun DraggableAiOrb(containerSize: IntSize, onTap: () -> Unit) {
    val context = LocalContext.current
    val prefs = remember { Prefs(context) }
    val scope = rememberCoroutineScope()
    val density = LocalDensity.current

    var fracX by remember { mutableFloatStateOf(DEFAULT_FRAC_X) }
    var fracY by remember { mutableFloatStateOf(DEFAULT_FRAC_Y) }
    var loaded by remember { mutableStateOf(false) }
    var dragging by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        val saved = prefs.loadOrb()
        if (saved != null) {
            fracX = saved.first
            fracY = saved.second
        }
        loaded = true
    }

    if (!loaded || containerSize.width == 0) return

    val boxPx = with(density) { boxSize.toPx() }
    val left = (fracX * containerSize.width - boxPx / 2f).coerceIn(6f, containerSize.width - boxPx - 6f)
    val top = (fracY * containerSize.height - boxPx / 2f).coerceIn(6f, containerSize.height - boxPx - 6f)

    val animatedScale by animateDpAsState(
        targetValue = if (dragging) 56.dp else 52.dp,
        animationSpec = tween(200),
        label = "orbScale",
    )

    Box(
        modifier = Modifier
            .offset(with(density) { left.toDp() }, with(density) { top.toDp() })
            .size(boxSize)
            .pointerInput(containerSize) {
                detectTapGestures(onTap = { onTap() })
            }
            .pointerInput(containerSize) {
                detectDragGestures(
                    onDragStart = { dragging = true },
                    onDragEnd = {
                        dragging = false
                        scope.launch { prefs.saveOrb(fracX, fracY) }
                    },
                    onDragCancel = { dragging = false },
                ) { change, dragAmount ->
                    change.consume()
                    fracX = ((fracX * containerSize.width + dragAmount.x) / containerSize.width).coerceIn(0f, 1f)
                    fracY = ((fracY * containerSize.height + dragAmount.y) / containerSize.height).coerceIn(0f, 1f)
                }
            },
    ) {
        AiOrb(size = animatedScale)
    }
}

/** Reports a Box's pixel size for [DraggableAiOrb]'s positioning math. */
@Composable
fun rememberContainerSize(): Pair<IntSize, Modifier> {
    var size by remember { mutableStateOf(IntSize.Zero) }
    val modifier = Modifier.onSizeChanged { size = it }
    return size to modifier
}
