package com.ezbillify.ezworkspace.ui.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.EaseOutCubic
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ezbillify.ezworkspace.R
import com.ezbillify.ezworkspace.services.AuthService
import com.ezbillify.ezworkspace.theme.AppColors
import com.ezbillify.ezworkspace.theme.InterFontFamily
import com.ezbillify.ezworkspace.theme.neumorphicRaised
import kotlinx.coroutines.delay

/** Cinematic 3-second brand intro, then routes to login or dashboard. */
@Composable
fun SplashScreen(onDone: (loggedIn: Boolean) -> Unit) {
    val scale = remember { Animatable(0.6f) }

    LaunchedEffect(Unit) {
        scale.animateTo(1f, animationSpec = tween(650, easing = EaseOutCubic))
        delay(2350)
        onDone(AuthService().isLoggedIn)
    }

    Box(
        modifier = Modifier.fillMaxSize().background(AppColors.scaffold),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(116.dp)
                    .scale(scale.value)
                    .neumorphicRaised(cornerRadius = 30.dp),
            ) {
                Image(
                    painter = painterResource(R.drawable.logo),
                    contentDescription = "EZ-Workspace",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(30.dp)),
                )
            }
            Spacer(Modifier.size(26.dp))
            Text(
                "EZ-Workspace",
                fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 26.sp,
                color = AppColors.ink,
            )
            Spacer(Modifier.size(6.dp))
            Text(
                "ENTERPRISE OPERATIONS PANEL",
                fontFamily = InterFontFamily, fontWeight = FontWeight.Bold, fontSize = 10.sp,
                color = AppColors.muted,
            )
            Spacer(Modifier.size(44.dp))
            CircularProgressIndicator(color = AppColors.primary, strokeWidth = 2.6.dp, modifier = Modifier.size(34.dp))
        }
    }
}
