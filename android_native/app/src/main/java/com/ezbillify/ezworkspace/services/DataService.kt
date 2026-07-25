package com.ezbillify.ezworkspace.services

import com.ezbillify.ezworkspace.EzWorkspaceApp
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Count
import io.github.jan.supabase.realtime.PostgresAction
import io.github.jan.supabase.realtime.RealtimeChannel
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgresChangeFlow
import io.github.jan.supabase.realtime.realtime
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.contentOrNull

/**
 * Live data layer over the SAME Supabase project as the web app and Flutter
 * build. Every screen: (1) fetches real rows immediately, and (2) opens a
 * realtime channel so inserts/updates/deletes push instantly. If a table
 * doesn't have Realtime enabled yet, the fetched data still shows and
 * pull-to-refresh works.
 */
class DataService {
    private val client get() = EzWorkspaceApp.supabase

    companion object {
        /** Maps a web module label → its Supabase table (discovered from the web app). */
        val moduleTables: Map<String, String> = mapOf(
            "Projects" to "projects",
            "Employees" to "employees",
            "Teams" to "teams",
            "Org Chart" to "teams",
            "Attendance" to "attendance_logs",
            "My Attendance" to "attendance_logs",
            "Recruitment Hub" to "applications",
            "ATS Scanner" to "applications",
            "Interviews" to "interviews",
            "Onboarding" to "onboarding_packets",
            "Claims" to "claims",
            "Reimbursements" to "reimbursements",
            "Payroll" to "payroll_runs",
            "Payslips" to "payroll_runs",
            "My Payslips" to "payroll_runs",
            "Invoicing" to "invoices",
            "Subscriptions" to "subscriptions",
            "Budgets" to "budgets",
            "Sales Pipeline" to "leads",
            "Clients" to "leads",
            "Mail Hub" to "mail_messages",
            "Inbox" to "mail_messages",
            "Messages" to "mail_messages",
            "Meetings" to "calendar_events",
            "My Calendar" to "calendar_events",
            "Academy" to "lms_courses",
            "Analytics" to "audit_logs",
            "Security & Audit" to "audit_logs",
            "Sessions" to "user_presence",
            "System Config" to "system_config",
        )

        fun tableFor(moduleLabel: String): String? = moduleTables[moduleLabel]

        // ── Generic display helpers (schema-agnostic) ──
        private val titleKeys = listOf(
            "name", "title", "subject", "full_name", "label",
            "company_name", "file_name", "course_name", "email", "action",
        )
        private val subtitleKeys = listOf(
            "status", "stage", "designation", "department", "role",
            "type", "category", "email", "created_at", "date",
        )

        fun title(row: JsonObject): String {
            for (k in titleKeys) {
                val v = row[k]?.jsonPrimitive?.contentOrNull
                if (!v.isNullOrBlank()) return v
            }
            for ((k, v) in row) {
                if (k != "id") {
                    val s = v.jsonPrimitive.contentOrNull
                    if (!s.isNullOrBlank()) return s
                }
            }
            return row["id"]?.jsonPrimitive?.contentOrNull ?: "—"
        }

        fun subtitle(row: JsonObject): String {
            for (k in subtitleKeys) {
                val v = row[k]?.jsonPrimitive?.contentOrNull
                if (!v.isNullOrBlank()) {
                    return if (k == "created_at" || k == "date") formatDate(v) else v
                }
            }
            return ""
        }

        private fun formatDate(iso: String): String = try {
            // Simple DD/MM/YYYY from an ISO-8601 prefix — matches the Flutter build's formatting.
            val datePart = iso.substringBefore("T")
            val (y, m, d) = datePart.split("-")
            "$d/$m/$y"
        } catch (_: Exception) {
            iso
        }
    }

    /** One-shot fetch of up to [limit] rows. */
    suspend fun fetch(table: String, limit: Long = 50): List<JsonObject> {
        return client.from(table).select {
            limit(limit)
        }.decodeList()
    }

    /** Exact row count (head request — cheap). */
    suspend fun count(table: String): Long {
        val result = client.from(table).select(Columns.raw("id")) {
            count(Count.EXACT)
            head = true
        }
        return result.countOrNull() ?: 0L
    }

    /** Realtime channel — calls [onChange] on any insert/update/delete. Collected in [scope]. */
    fun subscribe(table: String, scope: CoroutineScope, onChange: () -> Unit): RealtimeChannel {
        val ch = client.realtime.channel("rt:$table:${System.nanoTime()}")
        ch.postgresChangeFlow<PostgresAction>(schema = "public") { this.table = table }
            .onEach { onChange() }
            .launchIn(scope)
        scope.launch { ch.subscribe() }
        return ch
    }

    suspend fun unsubscribe(channel: RealtimeChannel?) {
        if (channel != null) client.realtime.removeChannel(channel)
    }
}
