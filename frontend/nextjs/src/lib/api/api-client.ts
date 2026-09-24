import "server-only";

import createClient, { type Client } from "openapi-fetch";

import { env } from "@/lib/env";
import { toApiError } from "./api-error";
import type { paths } from "./schema";

export type ApiClient = Client<paths>;

/**
 * The only place an API client is created. It runs on the server, so the browser never holds a
 * token and never learns the backend's address (docs/architecture.md#web).
 */
export function createApiClient(options: { accessToken?: string } = {}): ApiClient {
  return createClient<paths>({
    baseUrl: env().API_BASE_URL,
    // Responses belong to one signed-in user and change as messages are sent, so they are never
    // served from a cache shared between requests.
    cache: "no-store",
    headers: {
      ...(options.accessToken !== undefined && {
        Authorization: `Bearer ${options.accessToken}`,
      }),
    },
  });
}

/**
 * Returns the body of a successful call and throws {@link ApiError} for anything else, so a failed
 * request can't be mistaken for an empty result.
 */
export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (!result.response.ok) {
    throw toApiError(result.response, result.error);
  }
  return result.data as T;
}
