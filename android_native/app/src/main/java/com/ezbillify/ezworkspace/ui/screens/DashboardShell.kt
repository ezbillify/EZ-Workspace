package com.ezbillify.ezworkspace.ui.screens

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Widgets
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.platform.LocalContext
import com.ezbillify.ezworkspace.services.AuthService
import com.ezbillify.ezworkspace.services.AppUser
import com.ezbillify.ezworkspace.services.Prefs
import com.ezbillify.ezworkspace.ui.components.DraggableAiOrb
import com.ezbillify.ezworkspace.ui.components.EzNavBar
import com.ezbillify.ezworkspace.ui.components.NavDest
import com.ezbillify.ezworkspace.ui.components.rememberContainerSize
import kotlinx.coroutines.launch

/** App shell — bottom nav (Home/Modules/Activity/Profile) + a free-floating, draggable EZ AI orb. */
@Composable
fun DashboardShell(
    onOpenModule: (section: Int, item: Int) -> Unit,
    onOpenEzAi: () -> Unit,
    onLoggedOut: () -> Unit,
) {
    val context = LocalContext.current
    val auth = remember { AuthService() }
    val scope = rememberCoroutineScope()
    var index by remember { mutableIntStateOf(0) }
    var user by remember { mutableStateOf<AppUser?>(null) }

    LaunchedEffect(Unit) { user = auth.loadProfile() }

    fun logout() {
        scope.launch {
            Prefs(context).clearOrb()
            auth.signOut()
            onLoggedOut()
        }
    }

    val navItems = listOf(
        NavDest(Icons.Filled.GridView, "Home"),
        NavDest(Icons.Filled.Widgets, "Modules"),
        NavDest(Icons.Filled.BarChart, "Activity"),
        NavDest(Icons.Filled.Person, "Profile"),
    )

    val (containerSize, sizeModifier) = rememberContainerSize()

    Box(Modifier.fillMaxSize().then(sizeModifier)) {
        Box(Modifier.fillMaxSize().padding(bottom = 84.dp)) {
            when (index) {
                0 -> DashboardScreen(user = user, onOpenModule = onOpenModule)
                1 -> ModulesScreen(onOpenModule = onOpenModule)
                2 -> ActivityScreen()
                3 -> ProfileScreen(user = user, onLogout = ::logout)
            }
        }
        Box(Modifier.fillMaxSize().padding(horizontal = 16.dp).padding(bottom = 12.dp), contentAlignment = Alignment.BottomCenter) {
            EzNavBar(index = index, items = navItems, onTap = { index = it })
        }
        DraggableAiOrb(containerSize = containerSize, onTap = onOpenEzAi)
    }
}
