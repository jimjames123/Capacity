import type { User } from "./types";

/** The landing route for a signed-in user, based on role and onboarding. */
export function homePathForUser(user: User): string {
  if (user.role === "ADMIN") return "/admin";
  return user.onboarded ? "/app" : "/onboard";
}
