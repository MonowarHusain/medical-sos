export type ValidRole = "PATIENT" | "DOCTOR" | "DRIVER" | "DELIVERY" | "ADMIN";

/**
 * Deterministically maps any user role to its designated dashboard route.
 * Unknown or missing roles always resolve safely to '/login' (never default to '/delivery').
 */
export function getRoleRoute(role?: string | null): string {
  if (!role || typeof role !== "string") {
    return "/login";
  }

  const normalized = role.trim().toUpperCase();

  switch (normalized) {
    case "PATIENT":
      return "/patient";
    case "DOCTOR":
      return "/appointments";
    case "DRIVER":
      return "/driver";
    case "DELIVERY":
    case "DELIVERY_MAN":
      return "/delivery";
    case "ADMIN":
      return "/admin";
    default:
      return "/login";
  }
}
