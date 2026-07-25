import 'package:flutter/material.dart';

/// Mirrors the web app's MASTER_NAV — the full module map of EZ-Workspace.
class ModuleItem {
  const ModuleItem(this.label, this.icon);
  final String label;
  final IconData icon;
}

class ModuleSection {
  const ModuleSection(this.title, this.items);
  final String title;
  final List<ModuleItem> items;
}

const List<ModuleSection> kModules = [
  ModuleSection('Organization', [
    ModuleItem('Admin Overview', Icons.dashboard_outlined),
    ModuleItem('HR Hub', Icons.groups_outlined),
    ModuleItem('Accounts Hub', Icons.account_balance_outlined),
    ModuleItem('Projects', Icons.folder_outlined),
    ModuleItem('Employees', Icons.badge_outlined),
    ModuleItem('Shift Management', Icons.schedule_outlined),
    ModuleItem('Teams', Icons.apartment_outlined),
    ModuleItem('Org Chart', Icons.account_tree_outlined),
  ]),
  ModuleSection('Workspace', [
    ModuleItem('Workspace Hub', Icons.dashboard_customize_outlined),
    ModuleItem('Documents', Icons.description_outlined),
    ModuleItem('Spreadsheets', Icons.table_chart_outlined),
    ModuleItem('Presentations', Icons.slideshow_outlined),
    ModuleItem('Notes', Icons.sticky_note_2_outlined),
  ]),
  ModuleSection('HR & Hiring', [
    ModuleItem('Recruitment Hub', Icons.work_outline),
    ModuleItem('ATS Scanner', Icons.document_scanner_outlined),
    ModuleItem('Interviews', Icons.record_voice_over_outlined),
    ModuleItem('Onboarding', Icons.assignment_ind_outlined),
  ]),
  ModuleSection('Operations', [
    ModuleItem('Attendance', Icons.event_available_outlined),
    ModuleItem('Priority Payout', Icons.bolt_outlined),
    ModuleItem('Claims', Icons.receipt_long_outlined),
    ModuleItem('Reimbursements', Icons.payments_outlined),
    ModuleItem('Incentives', Icons.card_giftcard_outlined),
    ModuleItem('KPI / KRA', Icons.trending_up_outlined),
    ModuleItem('Payroll', Icons.currency_rupee_outlined),
    ModuleItem('Payslips', Icons.request_page_outlined),
    ModuleItem('Support Center', Icons.support_agent_outlined),
  ]),
  ModuleSection('Finance', [
    ModuleItem('Invoicing', Icons.credit_card_outlined),
    ModuleItem('Vendors', Icons.storefront_outlined),
    ModuleItem('Subscriptions', Icons.sell_outlined),
    ModuleItem('Budgets', Icons.savings_outlined),
  ]),
  ModuleSection('CRM', [
    ModuleItem('Sales Pipeline', Icons.hub_outlined),
    ModuleItem('Clients', Icons.handshake_outlined),
  ]),
  ModuleSection('Communications', [
    ModuleItem('Mail Hub', Icons.mail_outline),
    ModuleItem('Inbox', Icons.inbox_outlined),
    ModuleItem('Messages', Icons.chat_bubble_outline),
    ModuleItem('Meetings', Icons.video_camera_front_outlined),
  ]),
  ModuleSection('My Account', [
    ModuleItem('My Profile', Icons.person_outline),
    ModuleItem('My Attendance', Icons.event_note_outlined),
    ModuleItem('My Calendar', Icons.calendar_month_outlined),
    ModuleItem('My Payslips', Icons.receipt_outlined),
    ModuleItem('My Performance', Icons.speed_outlined),
    ModuleItem('Academy', Icons.school_outlined),
  ]),
  ModuleSection('System', [
    ModuleItem('Analytics', Icons.bar_chart_outlined),
    ModuleItem('Sessions', Icons.devices_outlined),
    ModuleItem('Security & Audit', Icons.gpp_good_outlined),
    ModuleItem('Permissions', Icons.admin_panel_settings_outlined),
    ModuleItem('System Config', Icons.settings_outlined),
  ]),
];
