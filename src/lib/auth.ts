export type UserRole = "admin" | "staff" | "customer";

export function getDefaultRouteForRole(role?: string | null) {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  return "/dashboard/profile";
}

export function canAccessRole(userRole: string | undefined | null, allowedRoles: readonly UserRole[]) {
  return Boolean(userRole && allowedRoles.includes(userRole as UserRole));
}
