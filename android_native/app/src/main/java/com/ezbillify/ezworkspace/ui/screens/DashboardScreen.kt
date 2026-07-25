package com.ezbillify.ezworkspace.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Badge
import androidx.compose.material.icons.outlined.Folder
import androidx.compose.material.icons.outlined.NotificationsNone
import androidx.compose.material.icons.outlined.Work
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ezbillify.ezworkspace.data.ModuleItem
import com.ezbillify.ezworkspace.data.kModules
import com.ezbillify.ezworkspace.services.AppUser
import com.ezbillify.ezworkspace.services.DataService
import com.ezbillify.ezworkspace.theme.AppColors
import com.ezbillify.ezworkspace.theme.InterFontFamily
import com.ezbillify.ezworkspace.theme.neumorphicRaised
import com.ezbillify.ezworkspace.theme.neumorphicSoft
import kotlinx.coroutines.launch

private data class StatDef(val label: String, val table: String, val icon: ImageVector)
private val statDefs = listOf(
    StatDef("Employees", "employees", Icons.Outlined.Badge),
    StatDef("Projects", "projects", Icons.Outlined.Folder),
    StatDef("Applicants", "applications", Icons.Outlined.Work),
    StatDef("Alerts", "system_notifications", Icons.Outlined.NotificationsNone),
)

/** Flat (sectionIndex, itemIndex, item) list of modules that map to a live Supabase table. */
private fun liveModules(): List<Triple<Int, Int, ModuleItem>> =
    kModules.flatMapIndexed { s, section ->
        section.items.mapIndexedNotNull { i, item ->
            if (DataService.tableFor(item.label) != null) Triple(s, i, item) else null
        }
    }.take(8)

@Composable
fun DashboardScreen(user: AppUser?, onOpenModule: (section: Int, item: Int) -> Unit) {
    val svc = remember { DataService() }
    val scope = rememberCoroutineScope()
    var counts by remember { mutableStateOf<Map<String, Long?>>(statDefs.associate { it.table to null }) }

    suspend fun loadAll() {
        val updated = counts.toMutableMap()
        for (s in statDefs) {
            updated[s.table] = try { svc.count(s.table) } catch (_: Exception) { -1L }
        }
        counts = updated
    }

    DisposableEffect(Unit) {
        val channels = statDefs.map { s -> svc.subscribe(s.table, scope) { scope.launch { loadAll() } } }
        scope.launch { loadAll() }
        onDispose { scope.launch { channels.forEach { svc.unsubscribe(it) } } }
    }

    val quick = remember { liveModules() }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(20.dp, 16.dp, 20.dp, 130.dp),
    ) {
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("Welcome back,", fontFamily = InterFontFamily, fontSize = 13.sp, color = AppColors.muted)
                    Text(
                        user?.name?.substringBefore(" ") ?: "there",
                        fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 28.sp, color = AppColors.ink,
                    )
                }
                Avatar(user)
            }
            Spacer(Modifier.size(20.dp))
        }
        item {
            StatGrid(counts)
            Spacer(Modifier.size(24.dp))
            Text("Quick access", fontFamily = InterFontFamily, fontWeight = FontWeight.ExtraBold, fontSize = 13.sp, color = AppColors.ink)
            Spacer(Modifier.size(12.dp))
        }
        item {
            QuickAccessGrid(quick, onOpenModule)
        }
    }
}

@Composable
private fun Avatar(user: AppUser?) {
    Box(
        modifier = Modifier.size(46.dp).background(AppColors.primary.copy(alpha = 0.12f), CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Text(user?.initials ?: "?", fontFamily = InterFontFamily, fontWeight = FontWeight.ExtraBold, color = AppColors.primary)
    }
}

@Composable
private fun StatGrid(counts: Map<String, Long?>) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        modifier = Modifier.fillMaxWidth().height(180.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        items(statDefs) { s ->
            val v = counts[s.table]
            val text = when { v == null -> "…"; v == -1L -> "—"; else -> v.toString() }
            Row(
                modifier = Modifier.fillMaxWidth().neumorphicRaised(cornerRadius = 20.dp).padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier.size(42.dp).clip(RoundedCornerShape(12.dp)).background(AppColors.primary.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center,
                ) { Icon(s.icon, contentDescription = null, tint = AppColors.primary) }
                Spacer(Modifier.size(12.dp))
                Column {
                    Text(text, fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 24.sp, color = AppColors.ink)
                    Text(s.label, fontFamily = InterFontFamily, fontSize = 11.sp, color = AppColors.muted)
                }
            }
        }
    }
}

@Composable
private fun QuickAccessGrid(modules: List<Triple<Int, Int, ModuleItem>>, onOpenModule: (Int, Int) -> Unit) {
    val rows = modules.chunked(2)
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        rows.forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                row.forEach { (section, itemIdx, item) ->
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onOpenModule(section, itemIdx) }
                            .neumorphicSoft(cornerRadius = 20.dp)
                            .padding(14.dp),
                    ) {
                        Box(
                            modifier = Modifier.size(40.dp).clip(RoundedCornerShape(12.dp)).background(AppColors.primary.copy(alpha = 0.1f)),
                            contentAlignment = Alignment.Center,
                        ) { Icon(item.icon, contentDescription = null, tint = AppColors.primary) }
                        Spacer(Modifier.size(28.dp))
                        Text(item.label, maxLines = 2, fontFamily = InterFontFamily, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = AppColors.ink)
                    }
                }
                if (row.size == 1) Spacer(Modifier.weight(1f))
            }
        }
    }
}

