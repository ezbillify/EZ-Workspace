package com.ezbillify.ezworkspace.data

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Assignment
import androidx.compose.material.icons.automirrored.outlined.Chat
import androidx.compose.material.icons.automirrored.outlined.TrendingUp
import androidx.compose.material.icons.outlined.*
import androidx.compose.ui.graphics.vector.ImageVector

/** Mirrors the web app's MASTER_NAV — the full module map of EZ-Workspace. */
data class ModuleItem(val label: String, val icon: ImageVector)
data class ModuleSection(val title: String, val items: List<ModuleItem>)

val kModules: List<ModuleSection> = listOf(
    ModuleSection("Organization", listOf(
        ModuleItem("Admin Overview", Icons.Outlined.Dashboard),
        ModuleItem("HR Hub", Icons.Outlined.Groups),
        ModuleItem("Accounts Hub", Icons.Outlined.AccountBalance),
        ModuleItem("Projects", Icons.Outlined.Folder),
        ModuleItem("Employees", Icons.Outlined.Badge),
        ModuleItem("Shift Management", Icons.Outlined.Schedule),
        ModuleItem("Teams", Icons.Outlined.Apartment),
        ModuleItem("Org Chart", Icons.Outlined.AccountTree),
    )),
    ModuleSection("Workspace", listOf(
        ModuleItem("Workspace Hub", Icons.Outlined.Dashboard),
        ModuleItem("Documents", Icons.Outlined.Description),
        ModuleItem("Spreadsheets", Icons.Outlined.TableChart),
        ModuleItem("Presentations", Icons.Outlined.Slideshow),
        ModuleItem("Notes", Icons.Outlined.StickyNote2),
    )),
    ModuleSection("HR & Hiring", listOf(
        ModuleItem("Recruitment Hub", Icons.Outlined.Work),
        ModuleItem("ATS Scanner", Icons.Outlined.DocumentScanner),
        ModuleItem("Interviews", Icons.Outlined.RecordVoiceOver),
        ModuleItem("Onboarding", Icons.AutoMirrored.Outlined.Assignment),
    )),
    ModuleSection("Operations", listOf(
        ModuleItem("Attendance", Icons.Outlined.EventAvailable),
        ModuleItem("Priority Payout", Icons.Outlined.Bolt),
        ModuleItem("Claims", Icons.Outlined.ReceiptLong),
        ModuleItem("Reimbursements", Icons.Outlined.Payments),
        ModuleItem("Incentives", Icons.Outlined.CardGiftcard),
        ModuleItem("KPI / KRA", Icons.AutoMirrored.Outlined.TrendingUp),
        ModuleItem("Payroll", Icons.Outlined.CurrencyRupee),
        ModuleItem("Payslips", Icons.Outlined.RequestPage),
        ModuleItem("Support Center", Icons.Outlined.SupportAgent),
    )),
    ModuleSection("Finance", listOf(
        ModuleItem("Invoicing", Icons.Outlined.CreditCard),
        ModuleItem("Vendors", Icons.Outlined.Storefront),
        ModuleItem("Subscriptions", Icons.Outlined.Sell),
        ModuleItem("Budgets", Icons.Outlined.Savings),
    )),
    ModuleSection("CRM", listOf(
        ModuleItem("Sales Pipeline", Icons.Outlined.Hub),
        ModuleItem("Clients", Icons.Outlined.Handshake),
    )),
    ModuleSection("Communications", listOf(
        ModuleItem("Mail Hub", Icons.Outlined.Mail),
        ModuleItem("Inbox", Icons.Outlined.Inbox),
        ModuleItem("Messages", Icons.AutoMirrored.Outlined.Chat),
        ModuleItem("Meetings", Icons.Outlined.VideoCameraFront),
    )),
    ModuleSection("My Account", listOf(
        ModuleItem("My Profile", Icons.Outlined.Person),
        ModuleItem("My Attendance", Icons.Outlined.EventNote),
        ModuleItem("My Calendar", Icons.Outlined.CalendarMonth),
        ModuleItem("My Payslips", Icons.Outlined.Receipt),
        ModuleItem("My Performance", Icons.Outlined.Speed),
        ModuleItem("Academy", Icons.Outlined.School),
    )),
    ModuleSection("System", listOf(
        ModuleItem("Analytics", Icons.Outlined.BarChart),
        ModuleItem("Sessions", Icons.Outlined.Devices),
        ModuleItem("Security & Audit", Icons.Outlined.GppGood),
        ModuleItem("Permissions", Icons.Outlined.AdminPanelSettings),
        ModuleItem("System Config", Icons.Outlined.Settings),
    )),
)
