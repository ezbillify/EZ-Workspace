package com.ezbillify.ezworkspace.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.outlined.Apartment
import androidx.compose.material.icons.outlined.Insights
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Mail
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.VerifiedUser
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ezbillify.ezworkspace.R
import com.ezbillify.ezworkspace.services.AuthService
import com.ezbillify.ezworkspace.theme.AppColors
import com.ezbillify.ezworkspace.theme.InterFontFamily
import com.ezbillify.ezworkspace.theme.neumorphicRaised
import com.ezbillify.ezworkspace.ui.components.NeuCard
import kotlinx.coroutines.launch

/** Responsive neumorphic login — single column on phones, 60/40 split on tablets/landscape. Wired to Supabase Auth. */
@Composable
fun LoginScreen(onSignedIn: () -> Unit) {
    val auth = remember { AuthService() }
    val scope = rememberCoroutineScope()
    val snackbar = remember { SnackbarHostState() }

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var obscure by remember { mutableStateOf(true) }
    var loading by remember { mutableStateOf(false) }

    fun submit() {
        if (email.isBlank() || password.isBlank()) {
            scope.launch { snackbar.showSnackbar("Enter your email and password.") }
            return
        }
        loading = true
        scope.launch {
            try {
                auth.signIn(email, password)
                onSignedIn()
            } catch (e: Exception) {
                snackbar.showSnackbar(e.message ?: "Invalid email or password.")
            } finally {
                loading = false
            }
        }
    }

    Box(Modifier.fillMaxSize().background(AppColors.scaffold)) {
        BoxWithConstraints(Modifier.fillMaxSize()) {
            val wide = maxWidth >= 820.dp
            if (wide) {
                Row(Modifier.fillMaxSize()) {
                    Box(Modifier.weight(6f)) { BrandPanel() }
                    Box(Modifier.weight(4f), contentAlignment = Alignment.Center) {
                        FormArea(email, { email = it }, password, { password = it }, obscure, { obscure = !obscure }, loading, ::submit, showLogo = false)
                    }
                }
            } else {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(
                        Modifier.verticalScroll(rememberScrollState()).padding(vertical = 24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        FormArea(email, { email = it }, password, { password = it }, obscure, { obscure = !obscure }, loading, ::submit, showLogo = true)
                    }
                }
            }
        }
        SnackbarHost(hostState = snackbar, modifier = Modifier.align(Alignment.BottomCenter).padding(16.dp))
    }
}

@Composable
private fun FormArea(
    email: String, onEmail: (String) -> Unit,
    password: String, onPassword: (String) -> Unit,
    obscure: Boolean, onToggleObscure: () -> Unit,
    loading: Boolean, onSubmit: () -> Unit,
    showLogo: Boolean,
) {
    Column(
        Modifier.widthIn(max = 420.dp).padding(horizontal = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        if (showLogo) {
            LogoTile(64.dp)
            Spacer(Modifier.size(14.dp))
            Text("EZ-Workspace", fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 26.sp, color = AppColors.ink)
            Spacer(Modifier.size(4.dp))
            Text("ENTERPRISE OPERATIONS PANEL", fontFamily = InterFontFamily, fontWeight = FontWeight.Bold, fontSize = 10.sp, color = AppColors.muted)
            Spacer(Modifier.size(22.dp))
        }

        NeuCard(modifier = Modifier.fillMaxWidth()) {
            Column {
                Text("Internal Sign In", fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 16.sp, color = AppColors.ink)
                Spacer(Modifier.size(4.dp))
                Text("Access your operations dashboard", fontFamily = InterFontFamily, fontSize = 12.sp, color = AppColors.muted)
                Spacer(Modifier.size(22.dp))

                FieldLabel("CORPORATE EMAIL")
                Spacer(Modifier.size(6.dp))
                NeuTextField(
                    value = email, onValueChange = onEmail,
                    placeholder = "name@ezbillify.in",
                    leading = Icons.Outlined.Mail,
                    keyboardType = KeyboardType.Email,
                )
                Spacer(Modifier.size(16.dp))

                FieldLabel("SECURITY PASSWORD")
                Spacer(Modifier.size(6.dp))
                NeuTextField(
                    value = password, onValueChange = onPassword,
                    placeholder = "••••••••",
                    leading = Icons.Outlined.Lock,
                    isPassword = true,
                    obscured = obscure,
                    onToggleObscure = onToggleObscure,
                )
                Spacer(Modifier.size(22.dp))

                PrimaryButton(loading = loading, onClick = onSubmit)
                Spacer(Modifier.size(16.dp))

                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("Forgot credentials?", fontFamily = InterFontFamily, fontWeight = FontWeight.Bold, fontSize = 11.sp, color = AppColors.muted)
                    Chip(Icons.Outlined.VerifiedUser, "Secure")
                }
            }
        }
        Spacer(Modifier.size(18.dp))
        Text(
            "© ${java.time.Year.now().value} EZBillify Ventures Pvt Ltd · AGPL-3.0",
            fontFamily = InterFontFamily, fontWeight = FontWeight.Medium, fontSize = 10.sp,
            color = AppColors.subtle,
        )
    }
}

@Composable
private fun FieldLabel(text: String) = Text(
    text, fontFamily = InterFontFamily, fontWeight = FontWeight.ExtraBold, fontSize = 11.sp, color = AppColors.muted,
)

@Composable
private fun NeuTextField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    leading: androidx.compose.ui.graphics.vector.ImageVector,
    keyboardType: KeyboardType = KeyboardType.Text,
    isPassword: Boolean = false,
    obscured: Boolean = false,
    onToggleObscure: (() -> Unit)? = null,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        placeholder = { Text(placeholder, fontFamily = InterFontFamily, color = AppColors.ink.copy(alpha = 0.4f)) },
        leadingIcon = { Icon(leading, contentDescription = null, tint = AppColors.muted) },
        trailingIcon = if (isPassword) {
            {
                IconButton(onClick = { onToggleObscure?.invoke() }) {
                    Icon(
                        if (obscured) Icons.Filled.VisibilityOff else Icons.Filled.Visibility,
                        contentDescription = null, tint = AppColors.muted,
                    )
                }
            }
        } else null,
        visualTransformation = if (isPassword && obscured) PasswordVisualTransformation() else VisualTransformation.None,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
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

@Composable
private fun PrimaryButton(loading: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(AppColors.primary)
            .clickable(enabled = !loading, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        if (loading) {
            CircularProgressIndicator(color = androidx.compose.ui.graphics.Color.White, strokeWidth = 2.4.dp, modifier = Modifier.size(22.dp))
        } else {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "AUTHORIZE ACCESS", fontFamily = InterFontFamily, fontWeight = FontWeight.Black,
                    fontSize = 12.sp, color = androidx.compose.ui.graphics.Color.White,
                )
                Spacer(Modifier.size(8.dp))
                Icon(Icons.Filled.ArrowForward, contentDescription = null, tint = androidx.compose.ui.graphics.Color.White, modifier = Modifier.size(16.dp))
            }
        }
    }
}

@Composable
private fun Chip(icon: androidx.compose.ui.graphics.vector.ImageVector, text: String) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(AppColors.primary.copy(alpha = 0.1f))
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, contentDescription = null, tint = AppColors.primary, modifier = Modifier.size(13.dp))
        Spacer(Modifier.size(5.dp))
        Text(text, fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 10.sp, color = AppColors.primary)
    }
}

@Composable
private fun LogoTile(size: androidx.compose.ui.unit.Dp) {
    Box(
        modifier = Modifier.size(size).neumorphicRaised(cornerRadius = 20.dp),
    ) {
        Image(
            painter = painterResource(R.drawable.logo),
            contentDescription = "EZ-Workspace",
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(20.dp)),
        )
    }
}

@Composable
private fun BrandPanel() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .clip(RoundedCornerShape(28.dp))
            .background(AppColors.ink)
            .padding(36.dp),
    ) {
        Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.SpaceBetween) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                LogoTile(44.dp)
                Spacer(Modifier.size(12.dp))
                Text("EZ-Workspace", fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 18.sp, color = androidx.compose.ui.graphics.Color.White)
            }
            Column {
                Text(
                    "Run your entire company\nfrom one secure panel.",
                    fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 34.sp, lineHeight = 38.sp,
                    color = androidx.compose.ui.graphics.Color.White,
                )
                Spacer(Modifier.size(24.dp))
                Feature(Icons.Outlined.VerifiedUser, "Bank-grade security & full audit trails")
                Feature(Icons.Outlined.Apartment, "HR, finance & operations unified")
                Feature(Icons.Outlined.Insights, "Real-time insights across every team")
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.Shield, contentDescription = null, tint = AppColors.primaryLight, modifier = Modifier.size(14.dp))
                Spacer(Modifier.size(6.dp))
                Text(
                    "Encrypted · SSO-ready · Audit-logged",
                    fontFamily = InterFontFamily, fontSize = 11.sp, color = androidx.compose.ui.graphics.Color.White.copy(alpha = 0.45f),
                )
            }
        }
    }
}

@Composable
private fun Feature(icon: androidx.compose.ui.graphics.vector.ImageVector, text: String) {
    Row(Modifier.padding(bottom = 14.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(38.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(AppColors.primary.copy(alpha = 0.16f)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = AppColors.primaryLight, modifier = Modifier.size(18.dp))
        }
        Spacer(Modifier.size(12.dp))
        Text(text, fontFamily = InterFontFamily, fontSize = 14.sp, color = androidx.compose.ui.graphics.Color.White.copy(alpha = 0.85f))
    }
}
