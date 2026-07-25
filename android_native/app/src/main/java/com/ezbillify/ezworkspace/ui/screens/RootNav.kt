package com.ezbillify.ezworkspace.ui.screens

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.ezbillify.ezworkspace.data.kModules

object Routes {
    const val SPLASH = "splash"
    const val LOGIN = "login"
    const val DASHBOARD = "dashboard"
    const val EZ_AI = "ez_ai"
    const val MODULE_DETAIL = "module/{section}/{item}"
    fun moduleDetail(section: Int, item: Int) = "module/$section/$item"
}

@Composable
fun RootNav() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = Routes.SPLASH) {
        composable(Routes.SPLASH) {
            SplashScreen(
                onDone = { loggedIn ->
                    navController.navigate(if (loggedIn) Routes.DASHBOARD else Routes.LOGIN) {
                        popUpTo(Routes.SPLASH) { inclusive = true }
                    }
                },
            )
        }
        composable(Routes.LOGIN) {
            LoginScreen(
                onSignedIn = {
                    navController.navigate(Routes.DASHBOARD) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                },
            )
        }
        composable(Routes.DASHBOARD) {
            DashboardShell(
                onOpenModule = { section, item -> navController.navigate(Routes.moduleDetail(section, item)) },
                onOpenEzAi = { navController.navigate(Routes.EZ_AI) },
                onLoggedOut = {
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(Routes.DASHBOARD) { inclusive = true }
                    }
                },
            )
        }
        composable(Routes.EZ_AI) {
            EzAiScreen(onBack = { navController.popBackStack() })
        }
        composable(
            route = Routes.MODULE_DETAIL,
            arguments = listOf(
                navArgument("section") { type = NavType.IntType },
                navArgument("item") { type = NavType.IntType },
            ),
        ) { backStackEntry ->
            val s = backStackEntry.arguments?.getInt("section") ?: 0
            val i = backStackEntry.arguments?.getInt("item") ?: 0
            val module = kModules.getOrNull(s)?.items?.getOrNull(i)
            if (module != null) {
                ModuleDetailScreen(module = module, onBack = { navController.popBackStack() })
            }
        }
    }
}
