export type UserRole =
  | "super_admin"
  | "platform_admin"
  | "support_manager"
  | "support_agent"
  | "finance_manager"
  | "content_manager"
  | "analytics_manager"
  | "developer"
  | "qa_engineer"
  | "auditor"
  | "user";

export type Permission =
  | "view_users"
  | "edit_users"
  | "suspend_users"
  | "delete_users"
  | "refund_payments"
  | "manage_templates"
  | "view_ai_logs"
  | "manage_plans"
  | "broadcast_notifications"
  | "view_analytics"
  | "export_reports"
  | "manage_support"
  | "view_audit_logs"
  | "view_system_health";

const permissionsMap: Record<UserRole, Permission[]> = {
  super_admin: [
    "view_users",
    "edit_users",
    "suspend_users",
    "delete_users",
    "refund_payments",
    "manage_templates",
    "view_ai_logs",
    "manage_plans",
    "broadcast_notifications",
    "view_analytics",
    "export_reports",
    "manage_support",
    "view_audit_logs",
    "view_system_health"
  ],
  platform_admin: [
    "view_users",
    "edit_users",
    "suspend_users",
    "manage_templates",
    "view_ai_logs",
    "manage_plans",
    "broadcast_notifications",
    "view_analytics",
    "export_reports",
    "view_system_health"
  ],
  support_manager: [
    "view_users",
    "manage_support",
    "view_analytics",
    "view_audit_logs"
  ],
  support_agent: [
    "view_users",
    "manage_support"
  ],
  finance_manager: [
    "refund_payments",
    "view_analytics",
    "export_reports"
  ],
  content_manager: [
    "manage_templates",
    "view_users"
  ],
  analytics_manager: [
    "view_analytics",
    "export_reports"
  ],
  developer: [
    "view_system_health",
    "view_ai_logs",
    "view_audit_logs"
  ],
  qa_engineer: [
    "view_system_health",
    "view_users",
    "view_audit_logs"
  ],
  auditor: [
    "view_users",
    "view_analytics",
    "view_ai_logs",
    "view_audit_logs",
    "view_system_health"
  ],
  user: []
};

/**
 * Checks if a role has the specified permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  if (role === "super_admin") return true; // Super admin overrides everything
  const permissions = permissionsMap[role];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Lists all permissions mapped to a role.
 */
export function getRolePermissions(role: UserRole): Permission[] {
  if (role === "super_admin") {
    // Return all keys
    return [
      "view_users",
      "edit_users",
      "suspend_users",
      "delete_users",
      "refund_payments",
      "manage_templates",
      "view_ai_logs",
      "manage_plans",
      "broadcast_notifications",
      "view_analytics",
      "export_reports",
      "manage_support",
      "view_audit_logs",
      "view_system_health"
    ];
  }
  return permissionsMap[role] || [];
}
