import { ACCESS_TOKEN } from "@/config/constants";
import { UserApi } from "@/apis/auth";

// Cache for permissions constants from API
let permissionsCache = null;
let permissionsPromise = null;

/**
 * Get permissions constants from API (cached)
 */
export const getPermissionsConstants = async () => {
  if (permissionsCache) {
    return permissionsCache;
  }

  if (permissionsPromise) {
    return permissionsPromise;
  }

  permissionsPromise = UserApi.getAllPermissions()
    .then((response) => {
      permissionsCache = response.permissions;
      return permissionsCache;
    })
    .catch((error) => {
      console.error("Error fetching permissions constants:", error);
      permissionsPromise = null;
      // Return empty object as fallback
      return {};
    });

  return permissionsPromise;
};

/**
 * Get permissions constants synchronously (from cache)
 * Returns null if not cached yet
 */
export const getPermissionsConstantsSync = () => {
  return permissionsCache;
};

/**
 * Clear permissions cache (useful for testing or refresh)
 */
export const clearPermissionsCache = () => {
  permissionsCache = null;
  permissionsPromise = null;
};

// Initialize permissions constants on module load (if in browser)
if (typeof window !== "undefined") {
  getPermissionsConstants().catch(() => {
    // Silently fail, will retry when needed
  });
}

// Export PERMISSIONS as a getter that uses cached values
// For backward compatibility with existing code using PERMISSIONS.VIEW_USERS
export const PERMISSIONS = new Proxy(
  {},
  {
    get(target, prop) {
      const cache = getPermissionsConstantsSync();
      if (cache && cache[prop]) {
        return cache[prop];
      }
      // Fallback: convert prop name to permission string format
      // e.g., VIEW_USERS -> "view_users"
      return prop
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .replace(/^_/, "");
    },
  }
);

/**
 * Decode JWT token to get payload
 */
const decodeJWT = (token) => {
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding JWT token:", error);
    return null;
  }
};

/**
 * Get permissions from JWT token
 */
const getPermissionsFromToken = () => {
  if (typeof window === "undefined") return [];

  try {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) return [];

    const decoded = decodeJWT(token);
    return decoded?.permissions || [];
  } catch (error) {
    console.error("Error getting permissions from token:", error);
    return [];
  }
};

/**
 * Get user permissions from JWT token (not from hardcoded role permissions)
 */
export const getUserPermissions = (user) => {
  if (!user) return [];

  // Get permissions directly from JWT token
  const tokenPermissions = getPermissionsFromToken();

  // Return permissions from token if available, otherwise return empty array
  return tokenPermissions || [];
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (user, permission) => {
  if (!user) return false;

  // Admin always has all permissions
  if (user.role === "admin") return true;

  const userPermissions = getUserPermissions(user);
  return userPermissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (user, permissions) => {
  if (!user || !permissions || permissions.length === 0) return false;

  // Admin always has all permissions
  if (user.role === "admin") return true;

  const userPermissions = getUserPermissions(user);
  return permissions.some((permission) => userPermissions.includes(permission));
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (user, permissions) => {
  if (!user || !permissions || permissions.length === 0) return false;

  // Admin always has all permissions
  if (user.role === "admin") return true;

  const userPermissions = getUserPermissions(user);
  return permissions.every((permission) =>
    userPermissions.includes(permission)
  );
};

/**
 * Check if user role is one of the specified roles
 */
export const hasRole = (user, roles) => {
  if (!user || !roles || roles.length === 0) return false;
  return roles.includes(user.role);
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = () => {
  if (typeof window === "undefined") return null;

  try {
    const userStr = localStorage.getItem("user_info");
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {
    console.error("Error parsing user info:", error);
    return null;
  }
};
