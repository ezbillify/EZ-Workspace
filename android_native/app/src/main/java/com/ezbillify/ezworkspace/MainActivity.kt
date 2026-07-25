package com.ezbillify.ezworkspace

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.ezbillify.ezworkspace.theme.AppColors
import com.ezbillify.ezworkspace.theme.EZWorkspaceTheme
import com.ezbillify.ezworkspace.ui.screens.RootNav

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            EZWorkspaceTheme {
                Surface(modifier = Modifier.fillMaxSize().background(AppColors.scaffold)) {
                    RootNav()
                }
            }
        }
    }
}
