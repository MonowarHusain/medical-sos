export const VALID_ROLES = ["PATIENT", "DOCTOR", "DRIVER", "DELIVERY", "ADMIN"] as const;
export type ValidRole = (typeof VALID_ROLES)[number];

export type SwitchUserRoleParams = {
  userId?: string;
  email?: string;
  newRole: string;
};
