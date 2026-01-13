"use client";

import {
  getCurrentUser,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
} from "@/utils/permissions";

/**
 * Component wrapper to conditionally render children based on permissions
 */
export const PermissionWrapper = ({
  children,
  permission,
  permissions,
  requireAll = false,
  roles,
  fallback = null,
}) => {
  const user = getCurrentUser();

  if (!user) {
    return fallback;
  }

  // Check by role
  if (roles && roles.length > 0) {
    if (!hasRole(user, roles)) {
      return fallback;
    }
  }

  // Check by single permission
  if (permission) {
    if (!hasPermission(user, permission)) {
      return fallback;
    }
  }

  // Check by multiple permissions
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(user, permissions)
      : hasAnyPermission(user, permissions);

    if (!hasAccess) {
      return fallback;
    }
  }

  return children;
};

export default PermissionWrapper;

