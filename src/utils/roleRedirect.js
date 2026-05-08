// src/utils/getDashboardPath.js

/**
 * Maps user roles to their respective dashboard routes
 * After login, users are redirected to /datasets (home) where they can navigate
 * to their role-specific dashboards based on their needs
 */
export const ROLE_ROUTES = {
  super_admin: "/datasets", // Home page for all users
  admin: "/datasets", // Home page - can access /dashboard/admin
  editor: "/datasets", // Home page - can access /dashboard/editor
  seller: "/datasets", // Home page - can access /dashboard/seller
  buyer: "/datasets", // Home page - can access /dashboard/buyer
  viewer: "/datasets", // Home page - can access /dashboard/viewer
};

/**
 * Gets the dashboard path for a given user role
 * All roles redirect to /datasets as the home page where they can:
 * 1. Browse and view all public datasets
 * 2. Navigate to their role-specific dashboards via navigation menu
 * 3. Manage their profile and settings
 *
 * @param {string} role - User role
 * @returns {string} Dashboard path
 */
export function getDashboardPath(role) {
  const normalizedRole = String(role || "")
    .trim()
    .toLowerCase();

  return ROLE_ROUTES[normalizedRole] || "/datasets";
}
