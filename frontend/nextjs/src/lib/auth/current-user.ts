import "server-only";

import { redirect } from "next/navigation";

import { createApiClient, unwrap } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import type { User } from "@/lib/api/types";
import { readAccessToken } from "./session";

/**
 * The signed-in user, or nothing. The backend decides: this app holds a token, it doesn't read it.
 */
export async function currentUser(): Promise<User | undefined> {
  const accessToken = await readAccessToken();
  if (accessToken === undefined) {
    return undefined;
  }
  try {
    return unwrap(await createApiClient({ accessToken }).GET("/api/v1/auth/me"));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return undefined;
    }
    throw error;
  }
}

/**
 * The user, or a redirect to sign-in. Every Server Action calls this too: an action is a POST to
 * its page's own route, so anyone who can send that request reaches it, proxy or no proxy.
 */
export async function requireUser(returnTo?: string): Promise<User> {
  const user = await currentUser();
  if (user === undefined) {
    redirect(returnTo === undefined ? "/login" : `/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  return user;
}
