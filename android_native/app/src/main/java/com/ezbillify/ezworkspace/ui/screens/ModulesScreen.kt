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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ezbillify.ezworkspace.data.kModules
import com.ezbillify.ezworkspace.theme.AppColors
import com.ezbillify.ezworkspace.theme.InterFontFamily
import com.ezbillify.ezworkspace.theme.neumorphicSoft

@Composable
fun ModulesScreen(onOpenModule: (section: Int, item: Int) -> Unit) {
    var query by remember { mutableStateOf("") }
    val q = query.trim().lowercase()

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 130.dp),
    ) {
        item {
            Column(Modifier.fillMaxWidth().padding(20.dp, 16.dp, 20.dp, 8.dp)) {
                Text("Modules", fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 28.sp, color = AppColors.ink)
                Spacer(Modifier.size(12.dp))
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    placeholder = { Text("Search modules…", fontFamily = InterFontFamily, color = AppColors.ink.copy(alpha = 0.4f)) },
                    leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null, tint = AppColors.muted) },
                    singleLine = true,
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = AppColors.inputFill,
                        unfocusedContainerColor = AppColors.inputFill,
                        focusedBorderColor = AppColors.primary,
                        unfocusedBorderColor = androidx.compose.ui.graphics.Color.White.copy(alpha = 0.8f),
                    ),
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }

        kModules.forEachIndexed { sectionIdx, section ->
            val filteredItems = section.items.withIndex().filter { (_, item) ->
                q.isEmpty() || item.label.lowercase().contains(q)
            }
            if (filteredItems.isNotEmpty()) {
                item {
                    Text(
                        section.title.uppercase(),
                        fontFamily = InterFontFamily, fontWeight = FontWeight.ExtraBold, fontSize = 11.sp,
                        color = AppColors.muted,
                        modifier = Modifier.padding(22.dp, 14.dp, 20.dp, 8.dp),
                    )
                }
                items(filteredItems.size, key = { filteredItems[it].index }) { idx ->
                    val (itemIdx, item) = filteredItems[idx]
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp)
                            .padding(bottom = 8.dp)
                            .clickable { onOpenModule(sectionIdx, itemIdx) }
                            .neumorphicSoft(cornerRadius = 14.dp)
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Box(
                            modifier = Modifier.size(38.dp).clip(RoundedCornerShape(10.dp)).background(AppColors.primary.copy(alpha = 0.1f)),
                            contentAlignment = Alignment.Center,
                        ) { Icon(item.icon, contentDescription = null, tint = AppColors.primary) }
                        Spacer(Modifier.size(12.dp))
                        Text(
                            item.label, modifier = Modifier.weight(1f),
                            fontFamily = InterFontFamily, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = AppColors.ink,
                        )
                        Icon(Icons.Filled.ChevronRight, contentDescription = null, tint = AppColors.subtle)
                    }
                }
            }
        }
    }
}
