package com.ezbillify.ezworkspace.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.NotificationsNone
import androidx.compose.material.icons.outlined.HelpOutline
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ezbillify.ezworkspace.services.AppUser
import com.ezbillify.ezworkspace.theme.AppColors
import com.ezbillify.ezworkspace.theme.InterFontFamily
import com.ezbillify.ezworkspace.theme.neumorphicRaised

@Composable
fun ProfileScreen(user: AppUser?, onLogout: () -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 20.dp),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(top = 16.dp, bottom = 110.dp),
    ) {
        item {
            Text("Profile", fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 28.sp, color = AppColors.ink)
            Spacer(Modifier.size(16.dp))
        }
        item {
            Row(
                modifier = Modifier.fillMaxWidth().neumorphicRaised(cornerRadius = 28.dp).padding(20.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier.size(60.dp).background(AppColors.primary.copy(alpha = 0.12f), CircleShape).border(2.dp, Color.White, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(user?.initials ?: "?", fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 22.sp, color = AppColors.primary)
                }
                Spacer(Modifier.size(14.dp))
                Column(Modifier.weight(1f)) {
                    Text(user?.name ?: "—", fontFamily = InterFontFamily, fontWeight = FontWeight.ExtraBold, fontSize = 17.sp, color = AppColors.ink)
                    Text(user?.email ?: "—", fontFamily = InterFontFamily, fontSize = 12.sp, color = AppColors.muted)
                    Spacer(Modifier.size(6.dp))
                    Box(
                        modifier = Modifier.clip(RoundedCornerShape(999.dp)).background(AppColors.primary.copy(alpha = 0.1f)).padding(10.dp, 4.dp),
                    ) {
                        Text(
                            (user?.role ?: "employee").uppercase(),
                            fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 10.sp, color = AppColors.primary,
                        )
                    }
                }
            }
            Spacer(Modifier.size(18.dp))
        }
        item {
            Column(Modifier.fillMaxWidth().neumorphicRaised(cornerRadius = 28.dp).padding(vertical = 6.dp)) {
                ProfileRow(Icons.Outlined.NotificationsNone, "Notifications")
                HorizontalDivider(color = AppColors.border)
                ProfileRow(Icons.Outlined.Lock, "Security & Privacy")
                HorizontalDivider(color = AppColors.border)
                ProfileRow(Icons.Outlined.HelpOutline, "Support & Help")
                HorizontalDivider(color = AppColors.border)
                ProfileRow(Icons.Outlined.Info, "About EZ-Workspace")
            }
            Spacer(Modifier.size(18.dp))
        }
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .border(1.dp, AppColors.danger.copy(alpha = 0.4f), RoundedCornerShape(14.dp))
                    .clickable(onClick = onLogout),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Filled.Logout, contentDescription = null, tint = AppColors.danger, modifier = Modifier.size(18.dp))
                Spacer(Modifier.size(8.dp))
                Text("Log out", fontFamily = InterFontFamily, fontWeight = FontWeight.ExtraBold, color = AppColors.danger)
            }
            Spacer(Modifier.size(14.dp))
        }
        item {
            Text(
                "EZ-Workspace · v1.0.0", modifier = Modifier.fillMaxWidth(),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                fontFamily = InterFontFamily, fontSize = 11.sp, color = AppColors.subtle,
            )
        }
    }
}

@Composable
private fun ProfileRow(icon: ImageVector, label: String) {
    Row(
        modifier = Modifier.fillMaxWidth().clickable {}.padding(16.dp, 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, contentDescription = null, tint = AppColors.ink, modifier = Modifier.size(20.dp))
        Spacer(Modifier.size(14.dp))
        Text(label, modifier = Modifier.weight(1f), fontFamily = InterFontFamily, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = AppColors.ink)
        Icon(Icons.Filled.ChevronRight, contentDescription = null, tint = AppColors.subtle)
    }
}
