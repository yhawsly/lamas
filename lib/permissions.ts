export const ROLES = {
    LECTURER: "LECTURER",
    HOD: "HOD",
    ADMIN: "ADMIN",
    SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type UserRole = keyof typeof ROLES;

/**
 * Checks if a given role is considered an Admin (either ADMIN or SUPER_ADMIN).
 */
export function isAdmin(role: string | null | undefined): boolean {
    return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
}

/**
 * Checks if a given role has Head of Department privileges (either HOD, ADMIN, or SUPER_ADMIN).
 */
export function hasHodPrivileges(role: string | null | undefined): boolean {
    return role === ROLES.HOD || isAdmin(role);
}

/**
 * Formats user checks requiring Department-level scope.
 * - Admins can intrinsically access all departments.
 * - HODs and Lecturers must explicitly match the requested department.
 */
export function canAccessDepartment(userRole: string | undefined, userDeptId: number | null | undefined, targetDeptId: number | null): boolean {
    if (isAdmin(userRole)) return true;
    if (!targetDeptId) return false;
    return userDeptId === targetDeptId;
}
