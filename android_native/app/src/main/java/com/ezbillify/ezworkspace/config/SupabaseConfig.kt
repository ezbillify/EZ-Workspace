package com.ezbillify.ezworkspace.config

/**
 * Supabase connection — SAME project as the EZ-Workspace web app and the
 * Flutter build. This is the PUBLIC `anon` key (role: anon), safe to embed in
 * a mobile client — data access is protected by Row Level Security on the
 * server. The service_role key is NEVER used here.
 */
object SupabaseConfig {
    const val URL = "https://ojepnycexumwpzcvlydb.supabase.co"
    const val ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZXBueWNleHVtd3B6Y3ZseWRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDA5MDgsImV4cCI6MjA5MTMxNjkwOH0.e_EmQlN-nGWxUe3NCn_tLv8StquYutPvjtFQLAvCh88"
}
