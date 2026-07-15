import type { StaffRole, Permissions, PermissionModule, PermissionAction } from "@/types";

/**
 * Get effective permissions for a staff role.
 * Super admins bypass all permission checks.
 * Admins get full access to products/orders/customers/inventory.
 * Staff get restricted access.
 */
export function getPermissionsForRole(role: StaffRole, customPermissions?: Partial<Permissions>): Permissions {
  const base: Permissions = {
    products:  { view: true, create: role !== "staff", edit: role !== "staff", delete: role === "super_admin" },
    orders:    { view: true, create: false, edit: role !== "staff", delete: false },
    customers: { view: true, create: false, edit: role === "super_admin", delete: false },
    inventory: { view: true, create: false, edit: role !== "staff", delete: false },
    marketing: { view: true, create: role !== "staff", edit: role !== "staff", delete: role === "super_admin" },
    reports:   { view: role !== "staff", create: false, edit: false, delete: false },
    settings:  { view: role === "super_admin", create: false, edit: role === "super_admin", delete: false },
    users:     { view: role === "super_admin", create: role === "super_admin", edit: role === "super_admin", delete: role === "super_admin" },
    categories:{ view: true, create: role !== "staff", edit: role !== "staff", delete: role === "super_admin" },
  };

  if (!customPermissions) return base;

  // Merge custom permissions (only override explicit values)
  const merged = { ...base };
  for (const mod of Object.keys(customPermissions) as PermissionModule[]) {
    const custom = customPermissions[mod];
    if (custom) {
      merged[mod] = { ...base[mod], ...custom };
    }
  }
  return merged;
}

/**
 * Check if a user has a specific permission.
 */
export function hasPermission(
  permissions: Permissions,
  module: PermissionModule,
  action: PermissionAction
): boolean {
  return permissions[module]?.[action] ?? false;
}

/**
 * Check if a user is a super admin (can access everything).
 */
export function isSuperAdmin(role: StaffRole): boolean {
  return role === "super_admin";
}
