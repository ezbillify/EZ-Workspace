package com.ezbillify.ezworkspace.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Podcasts
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ezbillify.ezworkspace.theme.AppColors
import com.ezbillify.ezworkspace.theme.InterFontFamily
import com.ezbillify.ezworkspace.ui.components.LiveList

/** Live activity feed — streams the shared `audit_logs` table in realtime. */
@Composable
fun ActivityScreen() {
    Column(Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(20.dp, 16.dp, 20.dp, 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top,
        ) {
            Column {
                Text("Activity", fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 28.sp, color = AppColors.ink)
                Text("Live workspace events", fontFamily = InterFontFamily, fontSize = 12.sp, color = AppColors.muted)
            }
            Icon(Icons.Filled.Podcasts, contentDescription = null, tint = AppColors.primary)
        }
        Box(Modifier.fillMaxSize()) {
            LiveList(table = "audit_logs", icon = Icons.Filled.History, limit = 60)
        }
    }
}
