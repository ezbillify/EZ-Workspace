package com.ezbillify.ezworkspace

import android.app.Application
import com.ezbillify.ezworkspace.config.SupabaseConfig
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime

class EzWorkspaceApp : Application() {
    companion object {
        lateinit var supabase: io.github.jan.supabase.SupabaseClient
            private set
    }

    override fun onCreate() {
        super.onCreate()
        supabase = createSupabaseClient(
            supabaseUrl = SupabaseConfig.URL,
            supabaseKey = SupabaseConfig.ANON_KEY,
        ) {
            install(Auth)
            install(Postgrest)
            install(Realtime)
        }
    }
}
