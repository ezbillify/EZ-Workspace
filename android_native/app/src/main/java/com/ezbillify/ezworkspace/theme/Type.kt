package com.ezbillify.ezworkspace.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.ezbillify.ezworkspace.R

/** Inter, bundled locally (fetched once from the same fonts.gstatic.com the web app uses) — no network dependency at runtime. */
val InterFontFamily = FontFamily(
    Font(R.font.inter_regular, FontWeight.Normal),
    Font(R.font.inter_medium, FontWeight.Medium),
    Font(R.font.inter_semibold, FontWeight.SemiBold),
    Font(R.font.inter_bold, FontWeight.Bold),
    Font(R.font.inter_extrabold, FontWeight.ExtraBold),
    Font(R.font.inter_black, FontWeight.Black),
)

fun ezTypography(color: Color) = Typography(
    bodyLarge = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Normal, fontSize = 14.sp, color = color),
    bodyMedium = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Normal, fontSize = 13.sp, color = color),
    titleLarge = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 22.sp, color = color),
    titleMedium = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = color),
    labelSmall = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Bold, fontSize = 11.sp, color = color),
)
