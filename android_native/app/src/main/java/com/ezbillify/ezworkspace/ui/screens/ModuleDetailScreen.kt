package com.ezbillify.ezworkspace.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ezbillify.ezworkspace.data.ModuleItem
import com.ezbillify.ezworkspace.services.DataService
import com.ezbillify.ezworkspace.theme.AppColors
import com.ezbillify.ezworkspace.theme.InterFontFamily
import com.ezbillify.ezworkspace.theme.neumorphicRaised
import com.ezbillify.ezworkspace.ui.components.LiveList

/** Module screen — shows LIVE Supabase data (realtime) when the module maps to a table; otherwise a connected placeholder. */
@Composable
fun ModuleDetailScreen(module: ModuleItem, onBack: () -> Unit) {
    val table = DataService.tableFor(module.label)

    Column(Modifier.fillMaxSize().background(AppColors.scaffold)) {
        Row(Modifier.fillMaxWidth().padding(8.dp, 8.dp, 16.dp, 8.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) {
                Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = AppColors.ink)
            }
            Icon(module.icon, contentDescription = null, tint = AppColors.primary, modifier = Modifier.size(20.dp))
            Spacer(Modifier.size(8.dp))
            Text(module.label, fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 18.sp, color = AppColors.ink)
        }
        Box(Modifier.fillMaxSize()) {
            if (table != null) {
                LiveList(table = table, icon = module.icon)
            } else {
                Placeholder(module)
            }
        }
    }
}

@Composable
private fun Placeholder(module: ModuleItem) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(
            modifier = Modifier.padding(24.dp).neumorphicRaised(cornerRadius = 28.dp).padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Box(
                modifier = Modifier.size(72.dp).clip(RoundedCornerShape(20.dp)).background(AppColors.primary.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center,
            ) { Icon(module.icon, contentDescription = null, tint = AppColors.primary, modifier = Modifier.size(34.dp)) }
            Spacer(Modifier.size(18.dp))
            Text(module.label, textAlign = TextAlign.Center, fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 20.sp, color = AppColors.ink)
            Spacer(Modifier.size(8.dp))
            Text(
                "This hub aggregates several live modules. Open its sections from the Modules tab to see realtime data.",
                textAlign = TextAlign.Center, fontFamily = InterFontFamily, fontSize = 13.sp, lineHeight = 18.sp, color = AppColors.muted,
            )
            Spacer(Modifier.size(18.dp))
            Row(
                modifier = Modifier.clip(RoundedCornerShape(999.dp)).background(AppColors.primary.copy(alpha = 0.1f)).padding(14.dp, 8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Filled.Sync, contentDescription = null, tint = AppColors.primary, modifier = Modifier.size(14.dp))
                Spacer(Modifier.size(6.dp))
                Text("Connected to Supabase", fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 11.sp, color = AppColors.primary)
            }
        }
    }
}
