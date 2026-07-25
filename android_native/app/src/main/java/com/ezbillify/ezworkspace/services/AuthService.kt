package com.ezbillify.ezworkspace.services

import com.ezbillify.ezworkspace.EzWorkspaceApp
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.exceptions.RestException
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Columns
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.contentOrNull

/** Employee profile loaded from the shared `employees` table. */
data class AppUser(
    val id: String,
    val name: String,
    val email: String,
    val role: String = "employee",
    val designation: String? = null,
    val department: String? = null,
) {
    val initials: String
        get() {
            val parts = name.trim().split(Regex("\\s+")).filter { it.isNotEmpty() }
            if (parts.isEmpty()) return "?"
            if (parts.size == 1) return parts[0].take(1).uppercase()
            return (parts.first().take(1) + parts.last().take(1)).uppercase()
        }
}

class AuthService {
    private val client get() = EzWorkspaceApp.supabase

    val isLoggedIn: Boolean
        get() = client.auth.currentSessionOrNull() != null

    /** Signs in against the SAME Supabase project the web app and Flutter build use. */
    suspend fun signIn(email: String, password: String): AppUser {
        val clean = email.trim().lowercase()
        client.auth.signInWith(Email) {
            this.email = clean
            this.password = password
        }
        return loadProfile() ?: AppUser(
            id = client.auth.currentUserOrNull()?.id ?: "",
            name = nameFromEmail(clean),
            email = clean,
        )
    }

    /** Loads the employee profile for the current auth user (RLS-permitting). */
    suspend fun loadProfile(): AppUser? {
        val user = client.auth.currentUserOrNull() ?: return null
        val email = (user.email ?: "").lowercase()
        return try {
            val row = client.from("employees")
                .select(Columns.raw("id, name, email, role, designation, department")) {
                    filter {
                        or {
                            ilike("email", email)
                            ilike("personal_email", email)
                            ilike("zoho_email", email)
                        }
                    }
                }
                .decodeSingleOrNull<JsonObject>() ?: return null

            fun str(key: String) = row[key]?.jsonPrimitive?.contentOrNull

            AppUser(
                id = str("id") ?: user.id,
                name = str("name") ?: nameFromEmail(email),
                email = str("email") ?: email,
                role = str("role") ?: "employee",
                designation = str("designation"),
                department = str("department"),
            )
        } catch (_: RestException) {
            // RLS may block the read — fall back to auth identity so login still works.
            AppUser(id = user.id, name = nameFromEmail(email), email = email)
        } catch (_: Exception) {
            AppUser(id = user.id, name = nameFromEmail(email), email = email)
        }
    }

    suspend fun signOut() {
        client.auth.signOut()
    }

    private fun nameFromEmail(email: String): String {
        val local = email.substringBefore("@").replace(Regex("[._]"), " ")
        return local.split(" ")
            .filter { it.isNotEmpty() }
            .joinToString(" ") { it.replaceFirstChar(Char::uppercase) }
    }
}
