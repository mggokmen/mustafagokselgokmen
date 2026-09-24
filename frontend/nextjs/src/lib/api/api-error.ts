import type { FieldError, Problem } from "./types";

/**
 * A backend response that wasn't a success, as a typed value. Callers branch on {@link code}, never
 * on the human-readable text (docs/api.md).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail: string | undefined;
  readonly errors: readonly FieldError[];
  /** Seconds to wait, from the `Retry-After` header of a 429. */
  readonly retryAfter: number | undefined;

  constructor(init: {
    status: number;
    code: string;
    title: string;
    detail?: string;
    errors?: readonly FieldError[];
    retryAfter?: number;
  }) {
    super(init.detail ?? init.title);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.detail = init.detail;
    this.errors = init.errors ?? [];
    this.retryAfter = init.retryAfter;
  }

  /** Field errors as a map, ready for a form. The first message per field wins. */
  fieldErrors(): Record<string, string> {
    const fields: Record<string, string> = {};
    for (const error of this.errors) {
      fields[error.field] ??= error.message;
    }
    return fields;
  }
}

/**
 * Builds an {@link ApiError} from a response. A body that isn't a Problem still produces an error
 * with the status, because a client must never treat an unreadable failure as a success.
 */
export function toApiError(response: Response, body: unknown): ApiError {
  const problem = asProblem(body);
  return new ApiError({
    status: problem?.status ?? response.status,
    code: problem?.code ?? "INTERNAL_ERROR",
    title: problem?.title ?? response.statusText ?? "Request failed",
    ...(problem?.detail !== undefined && { detail: problem.detail }),
    ...(problem?.errors !== undefined && { errors: problem.errors }),
    ...(retryAfter(response) !== undefined && { retryAfter: retryAfter(response) }),
  });
}

function asProblem(body: unknown): Problem | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }
  const candidate = body as Partial<Problem>;
  return typeof candidate.code === "string" && typeof candidate.status === "number"
    ? (candidate as Problem)
    : undefined;
}

function retryAfter(response: Response): number | undefined {
  const header = response.headers.get("Retry-After");
  if (header === null) {
    return undefined;
  }
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}
