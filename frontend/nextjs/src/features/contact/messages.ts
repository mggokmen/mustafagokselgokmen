import "server-only";

import { redirect } from "next/navigation";

import { createApiClient, unwrap } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import type { ContactMessagePage } from "@/lib/api/types";
import { readAccessToken } from "@/lib/auth/session";

export const PAGE_SIZE = 10;

/**
 * The messages this user may see. Which ones those are is the backend's decision, not a filter
 * applied here: a `USER` is shown their own, an `ADMIN` every one.
 */
export async function listContactMessages(page: number): Promise<ContactMessagePage> {
  const accessToken = await readAccessToken();
  try {
    return unwrap(
      await createApiClient({ accessToken }).GET("/api/v1/contact-messages", {
        params: { query: { page, size: PAGE_SIZE, sort: "createdAt,desc" } },
      }),
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      // A Server Component can't set cookies, so it can't refresh. Sign-in can.
      redirect("/login?returnTo=%2Fcontact");
    }
    throw error;
  }
}

/** A page index from the URL, which anyone can type anything into. */
export function pageIndex(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw ?? 0);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}
