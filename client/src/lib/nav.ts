import type { User } from "./types";

/** The landing route for a signed-in user, based on role and onboarding. */
export function homePathForUser(user: User): string {
  if (user.role === "ADMIN") return "/admin";
  if (user.role === "PROVIDER") return "/provider";
  if (user.role === "ORG") return "/org";
  return user.onboarded ? "/app" : "/onboard";
}
