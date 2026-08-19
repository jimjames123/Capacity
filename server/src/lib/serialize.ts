import type { User } from "@prisma/client";

/** Strips secrets from a user record before sending to the client. */
export function publicUser(user: User) {
  const { passwordHash, ...rest } = user;
  return rest;
}
