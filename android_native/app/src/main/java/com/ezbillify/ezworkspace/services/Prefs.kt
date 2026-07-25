package com.ezbillify.ezworkspace.services

import android.content.Context
import androidx.datastore.preferences.core.doublePreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first

private val Context.dataStore by preferencesDataStore(name = "ez_workspace_prefs")

/**
 * Stores the floating EZ AI orb position as screen fractions (0..1) so it
 * survives app restarts and adapts to any screen size. Mirrors the Flutter
 * build's `Prefs` (which used shared_preferences) — DataStore is the modern
 * Android-recommended replacement.
 */
class Prefs(private val context: Context) {
    private val kx = doublePreferencesKey("orb_frac_x")
    private val ky = doublePreferencesKey("orb_frac_y")

    suspend fun loadOrb(): Pair<Float, Float>? {
        val prefs = context.dataStore.data.first()
        val x = prefs[kx] ?: return null
        val y = prefs[ky] ?: return null
        return x.toFloat() to y.toFloat()
    }

    suspend fun saveOrb(x: Float, y: Float) {
        context.dataStore.edit { it[kx] = x.toDouble(); it[ky] = y.toDouble() }
    }

    /** Clears saved position — used on logout so it re-centers on next login. */
    suspend fun clearOrb() {
        context.dataStore.edit {
            it.remove(kx)
            it.remove(ky)
        }
    }
}
