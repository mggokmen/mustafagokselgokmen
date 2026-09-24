import { z } from "zod";

/**
 * The same rule the contract states: at least one character that isn't whitespace. Written as a
 * pattern rather than a trim, so the value sent is the value the visitor typed.
 */
const NOT_BLANK = /^[\s\S]*\S[\s\S]*$/;

/**
 * Mirrors `CreateContactMessageRequest` in contract/openapi.yaml, so a visitor sees a mistake
 * before a request is made. The server stays the authority: whatever it rejects is shown too
 * (docs/frontend/nextjs.md).
 */
export const createContactMessageSchema = z.object({
  subject: z
    .string()
    .min(1, "Enter a subject.")
    .max(150, "The subject can be at most 150 characters.")
    .regex(NOT_BLANK, "Enter a subject."),
  message: z
    .string()
    .min(1, "Enter a message.")
    .max(5000, "The message can be at most 5000 characters.")
    .regex(NOT_BLANK, "Enter a message."),
});

export type CreateContactMessage = z.infer<typeof createContactMessageSchema>;

export const SUBJECT_MAX_LENGTH = 150;
export const MESSAGE_MAX_LENGTH = 5000;

/** The first problem per field, which is what a form shows. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string") {
      fields[field] ??= issue.message;
    }
  }
  return fields;
}
