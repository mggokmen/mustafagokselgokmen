import { describe, expect, it } from "vitest";

import { createContactMessageSchema, fieldErrors } from "./schemas";

function parse(input: { subject: string; message: string }) {
  return createContactMessageSchema.safeParse(input);
}

const valid = { subject: "A subject", message: "A message" };

describe("createContactMessageSchema", () => {
  it("accepts a message a visitor would actually send", () => {
    expect(parse(valid).success).toBe(true);
  });

  it("keeps the text exactly as it was typed", () => {
    const result = parse({ subject: "  Spaced  ", message: "  Body\n\n  " });

    expect(result.success).toBe(true);
    expect(result.data?.subject).toBe("  Spaced  ");
    expect(result.data?.message).toBe("  Body\n\n  ");
  });

  it.each([
    ["", "empty"],
    ["   ", "only spaces"],
    ["\n\t ", "only whitespace"],
  ])("refuses a subject that is %s (%s)", (subject) => {
    const result = parse({ ...valid, subject });

    expect(result.success).toBe(false);
    expect(fieldErrors(result.error!)["subject"]).toBe("Enter a subject.");
  });

  it.each([
    ["", "empty"],
    ["  \r\n ", "only whitespace"],
  ])("refuses a message that is %s (%s)", (message) => {
    const result = parse({ ...valid, message });

    expect(result.success).toBe(false);
    expect(fieldErrors(result.error!)["message"]).toBe("Enter a message.");
  });

  it("uses the contract's length limits", () => {
    expect(parse({ ...valid, subject: "s".repeat(150) }).success).toBe(true);
    expect(parse({ ...valid, subject: "s".repeat(151) }).success).toBe(false);
    expect(parse({ ...valid, message: "m".repeat(5000) }).success).toBe(true);
    expect(parse({ ...valid, message: "m".repeat(5001) }).success).toBe(false);
  });

  it("reports a problem for each field at once", () => {
    const result = parse({ subject: "", message: "" });

    expect(fieldErrors(result.error!)).toEqual({
      subject: "Enter a subject.",
      message: "Enter a message.",
    });
  });
});
