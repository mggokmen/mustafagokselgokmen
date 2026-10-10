"use server";

import { redirect } from "next/navigation";

import { createApiClient } from "@/lib/api/api-client";
import { clearedSessionCookies, readRefreshToken, writeCookies } from "@/lib/auth/session";

/**
 * Ends the session in both places: the backend revokes the refresh token and its family, and the
 * cookies go. The cookies are cleared even if the backend call fails, so a browser is never left
 * holding a session the user asked to end.
 */
export async function logout(): Promise<never> {
  const refreshToken = await readRefreshToken();
  if (refreshToken !== undefined) {
    try {
      await createApiClient().POST("/api/v1/auth/logout", { body: { refreshToken } });
    } catch {
      // Already revoked or unreachable; the cookies still go.
    }
  }
  await writeCookies(clearedSessionCookies());
  redirect("/");
}
