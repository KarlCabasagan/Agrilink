/**
 * Pure route access resolution logic
 * Roles:
 * 1 = Consumer
 * 2 = Producer
 * 3 = Admin
 */

export const resolveRouteAccess = ({ user, userRole, allowedRoles }) => {
    // Unauthenticated
    if (!user) {
        return { allowed: false, redirectTo: "/login" };
    }

    // Role still loading or undefined
    if (userRole === null || userRole === undefined) {
        return { allowed: false, redirectTo: "/login" };
    }

    // Access allowed if role is in allowedRoles list
    if (Array.isArray(allowedRoles) && allowedRoles.includes(userRole)) {
        return { allowed: true, redirectTo: null };
    }

    // Role mismatch:
    // Admin trying to access non-admin protected route -> redirect to admin dashboard
    if (userRole === 3) {
        return { allowed: false, redirectTo: "/admin/dashboard" };
    }

    // Producer or Consumer trying to access forbidden route -> redirect to home
    return { allowed: false, redirectTo: "/" };
};
