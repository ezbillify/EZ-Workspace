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
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ezbillify.ezworkspace.theme.AppColors
import com.ezbillify.ezworkspace.theme.InterFontFamily
import com.ezbillify.ezworkspace.theme.neumorphicSoft
import com.ezbillify.ezworkspace.ui.components.AiOrb
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private data class Msg(val text: String, val fromAi: Boolean)

@Composable
fun EzAiScreen(onBack: () -> Unit) {
    val scope = rememberCoroutineScope()
    val listState = rememberLazyListState()
    var messages by remember {
        mutableStateOf(
            listOf(Msg("Hi 👋 I'm EZ AI. Ask me about your workspace — attendance, payroll, tasks, or anything else.", true)),
        )
    }
    var input by remember { mutableStateOf("") }
    var thinking by remember { mutableStateOf(false) }

    fun send() {
        val t = input.trim()
        if (t.isEmpty()) return
        messages = messages + Msg(t, false)
        input = ""
        thinking = true
        scope.launch {
            delay(900)
            thinking = false
            messages = messages + Msg(
                "EZ AI is being connected to your workspace backend. Once linked, I'll answer this live from your EZ-Workspace data. ✨",
                true,
            )
        }
    }

    LaunchedEffect(messages.size, thinking) {
        if (messages.isNotEmpty()) listState.animateScrollToItem(messages.size - 1 + if (thinking) 1 else 0)
    }

    Column(Modifier.fillMaxSize().background(AppColors.scaffold)) {
        Row(Modifier.fillMaxWidth().padding(6.dp, 8.dp, 20.dp, 4.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) {
                Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = AppColors.ink)
            }
            AiOrb(size = 44.dp)
            Spacer(Modifier.size(4.dp))
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("EZ AI", fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 18.sp, color = AppColors.ink)
                    Spacer(Modifier.size(8.dp))
                    Row(
                        modifier = Modifier.clip(RoundedCornerShape(999.dp)).background(AppColors.primary.copy(alpha = 0.1f)).padding(8.dp, 3.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Box(Modifier.size(6.dp).background(AppColors.primary, CircleShape))
                        Spacer(Modifier.size(5.dp))
                        Text("LIVE", fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 9.sp, color = AppColors.primary)
                    }
                }
                Text("Your workspace assistant", fontFamily = InterFontFamily, fontSize = 11.sp, color = AppColors.muted)
            }
        }

        LazyColumn(
            state = listState,
            modifier = Modifier.weight(1f).fillMaxWidth(),
            contentPadding = PaddingValues(16.dp, 12.dp, 16.dp, 12.dp),
        ) {
            items(messages.size) { i -> Bubble(messages[i]) }
            if (thinking) item { Bubble(Msg("…", true), typing = true) }
        }

        Composer(input, { input = it }, onSend = ::send)
    }
}

@Composable
private fun Bubble(m: Msg, typing: Boolean = false) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = if (m.fromAi) Arrangement.Start else Arrangement.End) {
        Box(
            modifier = Modifier
                .widthIn(max = 300.dp)
                .padding(vertical = 5.dp)
                .clip(
                    RoundedCornerShape(
                        topStart = 16.dp, topEnd = 16.dp,
                        bottomStart = if (m.fromAi) 4.dp else 16.dp,
                        bottomEnd = if (m.fromAi) 16.dp else 4.dp,
                    ),
                )
                .then(if (m.fromAi) Modifier.neumorphicSoft(cornerRadius = 16.dp) else Modifier.background(AppColors.primary))
                .padding(14.dp, 11.dp),
        ) {
            if (typing) {
                Text("EZ AI is typing…", fontFamily = InterFontFamily, fontSize = 13.sp, fontStyle = FontStyle.Italic, color = AppColors.muted)
            } else {
                Text(
                    m.text, fontFamily = InterFontFamily, fontSize = 13.5.sp, lineHeight = 18.sp, fontWeight = FontWeight.Medium,
                    color = if (m.fromAi) AppColors.ink else Color.White,
                )
            }
        }
    }
}

@Composable
private fun Composer(value: String, onChange: (String) -> Unit, onSend: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(16.dp, 4.dp, 16.dp, 96.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        OutlinedTextField(
            value = value,
            onValueChange = onChange,
            placeholder = { Text("Ask EZ AI…", fontFamily = InterFontFamily, color = AppColors.muted) },
            singleLine = true,
            shape = RoundedCornerShape(999.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = AppColors.cardFill,
                unfocusedContainerColor = AppColors.cardFill,
                focusedBorderColor = AppColors.primary,
                unfocusedBorderColor = Color.White.copy(alpha = 0.8f),
            ),
            modifier = Modifier.weight(1f),
        )
        Spacer(Modifier.size(8.dp))
        Box(
            modifier = Modifier.size(42.dp).background(AppColors.primary, CircleShape).clickable(onClick = onSend),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Filled.ArrowUpward, contentDescription = "Send", tint = Color.White)
        }
    }
}
