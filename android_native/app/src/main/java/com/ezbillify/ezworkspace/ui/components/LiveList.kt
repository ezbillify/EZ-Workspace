package com.ezbillify.ezworkspace.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ezbillify.ezworkspace.services.DataService
import com.ezbillify.ezworkspace.theme.AppColors
import com.ezbillify.ezworkspace.theme.InterFontFamily
import com.ezbillify.ezworkspace.theme.neumorphicRaised
import com.ezbillify.ezworkspace.theme.neumorphicSoft
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject

/** Renders real rows from a Supabase [table] and live-updates via realtime. Mirrors the Flutter build's LiveList. */
@Composable
fun LiveList(table: String, icon: ImageVector, limit: Long = 50) {
    val svc = remember { DataService() }
    val scope = rememberCoroutineScope()
    var rows by remember { mutableStateOf<List<JsonObject>?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var live by remember { mutableStateOf(false) }
    var refreshing by remember { mutableStateOf(false) }

    suspend fun load() {
        try {
            rows = svc.fetch(table, limit)
            error = null
        } catch (e: Exception) {
            error = e.message ?: "Unable to load this table."
        }
    }

    DisposableEffect(table) {
        val ch = svc.subscribe(table, scope) {
            live = true
            scope.launch { load() }
        }
        scope.launch { load() }
        onDispose { scope.launch { svc.unsubscribe(ch) } }
    }

    when {
        error != null -> EmptyState(Icons.Outlined.Lock, "Restricted", "This table isn't readable for your role yet.")
        rows == null -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = AppColors.primary)
        }
        rows!!.isEmpty() -> EmptyState(icon, "No records", "Nothing here yet — new rows appear instantly.")
        else -> PullToRefreshBox(
            isRefreshing = refreshing,
            onRefresh = {
                scope.launch {
                    refreshing = true
                    load()
                    refreshing = false
                }
            },
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 120.dp),
            ) {
                item { LiveHeader(live, rows!!.size) }
                items(rows!!) { row -> Spacer(Modifier.size(8.dp)); RowCard(row, icon) }
            }
        }
    }
}

@Composable
private fun LiveHeader(live: Boolean, count: Int) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(
            modifier = Modifier
                .background(AppColors.primary.copy(alpha = 0.1f), RoundedCornerShape(999.dp))
                .padding(horizontal = 10.dp, vertical = 5.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(Modifier.size(7.dp).background(AppColors.primary, CircleShape))
            Spacer(Modifier.width(6.dp))
            Text(
                text = if (live) "LIVE · updated" else "LIVE",
                fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 10.sp,
                color = AppColors.primary,
            )
        }
        Spacer(Modifier.weight(1f))
        Text("$count records", fontFamily = InterFontFamily, fontWeight = FontWeight.Bold, fontSize = 11.sp, color = AppColors.muted)
    }
}

@Composable
private fun RowCard(row: JsonObject, icon: ImageVector) {
    val title = DataService.title(row)
    val sub = DataService.subtitle(row)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .neumorphicSoft(cornerRadius = 14.dp)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier.size(40.dp).background(AppColors.primary.copy(alpha = 0.1f), RoundedCornerShape(10.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = AppColors.primary)
        }
        Spacer(Modifier.width(12.dp))
        androidx.compose.foundation.layout.Column {
            Text(title, maxLines = 1, fontFamily = InterFontFamily, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = AppColors.ink)
            if (sub.isNotEmpty()) {
                Text(sub, maxLines = 1, fontFamily = InterFontFamily, fontSize = 11.sp, color = AppColors.muted)
            }
        }
    }
}

@Composable
private fun EmptyState(icon: ImageVector, title: String, msg: String) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        androidx.compose.foundation.layout.Column(
            modifier = Modifier.padding(28.dp).neumorphicRaised(cornerRadius = 28.dp).padding(26.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Icon(icon, contentDescription = null, tint = AppColors.primary, modifier = Modifier.size(40.dp))
            Spacer(Modifier.size(14.dp))
            Text(title, fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 17.sp, color = AppColors.ink)
            Spacer(Modifier.size(6.dp))
            Text(msg, fontFamily = InterFontFamily, fontSize = 13.sp, color = AppColors.muted)
        }
    }
}
