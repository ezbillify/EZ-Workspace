package com.ezbillify.ezworkspace.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ezbillify.ezworkspace.theme.AppColors
import com.ezbillify.ezworkspace.theme.InterFontFamily
import com.ezbillify.ezworkspace.theme.neumorphicRaised

data class NavDest(val icon: ImageVector, val label: String)

/** Neumorphic floating bottom navigation bar — clean tap-only tabs, no drag/liquid effects. */
@Composable
fun EzNavBar(
    index: Int,
    items: List<NavDest>,
    onTap: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(68.dp)
            .neumorphicRaised(cornerRadius = 32.dp)
            .padding(horizontal = 8.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        items.forEachIndexed { i, item ->
            NavTab(
                item = item,
                active = i == index,
                modifier = Modifier.weight(1f),
                onClick = { onTap(i) },
            )
        }
    }
}

@Composable
private fun NavTab(item: NavDest, active: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Column(
        modifier = modifier
            .padding(horizontal = 4.dp)
            .then(
                if (active) Modifier.background(AppColors.primary.copy(alpha = 0.12f), RoundedCornerShape(22.dp))
                else Modifier
            )
            .clickable(onClick = onClick)
            .padding(vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(
            imageVector = item.icon,
            contentDescription = item.label,
            tint = if (active) AppColors.primary else AppColors.muted,
        )
        Text(
            text = item.label,
            fontFamily = InterFontFamily,
            fontWeight = if (active) FontWeight.ExtraBold else FontWeight.SemiBold,
            fontSize = 10.sp,
            color = if (active) AppColors.primary else AppColors.muted,
        )
    }
}
