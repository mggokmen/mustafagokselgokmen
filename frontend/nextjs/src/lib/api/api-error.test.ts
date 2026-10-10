import { describe, expect, it } from "vitest";

import { ApiError, toApiError } from "./api-error";

function response(status: number, headers: Record<string, string> = {}): Response {
  return new Response(null, { status, headers });
}

describe("toApiError", () => {
  it("takes the code and detail from a problem body", () => {
    const error = toApiError(response(404), {
      type: "about:blank",
      title: "Not found",
      status: 404,
      code: "NOT_FOUND",
      detail: "No message with this id.",
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.detail).toBe("No message with this id.");
    expect(error.message).toBe("No message with this id.");
  });

  it("keeps field errors so a form can show them", () => {
    const error = toApiError(response(400), {
      type: "about:blank",
      title: "Validation failed",
      status: 400,
      code: "VALIDATION_FAILED",
      errors: [
        { field: "subject", message: "must not be blank" },
        { field: "message", message: "must not be blank" },
        { field: "subject", message: "size must be between 1 and 150" },
      ],
    });

    expect(error.fieldErrors()).toEqual({
      subject: "must not be blank",
      message: "must not be blank",
    });
  });

  it("reads Retry-After from a rate-limited response", () => {
    const error = toApiError(response(429, { "Retry-After": "42" }), {
      type: "about:blank",
      title: "Too many requests",
      status: 429,
      code: "RATE_LIMITED",
    });

    expect(error.retryAfter).toBe(42);
  });

  it("ignores a Retry-After that isn't a number of seconds", () => {
    const error = toApiError(response(429, { "Retry-After": "Wed, 21 Oct 2026 07:28:00 GMT" }), {
      type: "about:blank",
      title: "Too many requests",
      status: 429,
      code: "RATE_LIMITED",
    });

    expect(error.retryAfter).toBeUndefined();
  });

  it("falls back to the response status when the body isn't a problem", () => {
    const error = toApiError(response(502), "<html>Bad gateway</html>");

    expect(error.status).toBe(502);
    expect(error.code).toBe("INTERNAL_ERROR");
    expect(error.errors).toEqual([]);
  });

  it("falls back when the body is empty", () => {
    const error = toApiError(response(500), undefined);

    expect(error.status).toBe(500);
    expect(error.code).toBe("INTERNAL_ERROR");
  });
});
