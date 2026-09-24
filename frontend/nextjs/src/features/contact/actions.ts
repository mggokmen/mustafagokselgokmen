"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createApiClient, unwrap } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import { requireUser } from "@/lib/auth/current-user";
import { readAccessToken } from "@/lib/auth/session";
import type { ContactFormState } from "./form-state";
import { createContactMessageSchema, fieldErrors } from "./schemas";

/**
 * Sends a contact message. The session is checked here, not only by the proxy: this runs as a POST
 * to the page's own route, so anyone able to send that request reaches this code
 * (docs/frontend/nextjs.md).
 */
export async function sendContactMessage(
  _previous: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  await requireUser("/contact");

  const parsed = createContactMessageSchema.safeParse({
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  const accessToken = await readAccessToken();
  let failure: unknown;
  try {
    unwrap(
      await createApiClient({ accessToken }).POST("/api/v1/contact-messages", {
        body: parsed.data,
      }),
    );
  } catch (error) {
    failure = error;
  }

  if (failure !== undefined) {
    // Outside the catch: redirect works by throwing, and a catch would swallow it.
    if (failure instanceof ApiError && failure.status === 401) {
      redirect("/login?returnTo=%2Fcontact");
    }
    return toFormState(failure);
  }

  // The message joins the list below the form.
  revalidatePath("/contact");
  return { sent: true };
}

/** Turns the contract's error into something the form can show (docs/api.md). */
function toFormState(error: unknown): ContactFormState {
  const generic = { message: "The message could not be sent. Please try again." };
  if (!(error instanceof ApiError)) {
    return generic;
  }
  switch (error.code) {
    case "VALIDATION_FAILED": {
      // The server found something this app's own rules let through.
      const errors = error.fieldErrors();
      return Object.keys(errors).length > 0 ? { errors } : generic;
    }
    case "RATE_LIMITED":
      return { message: rateLimitMessage(error.retryAfter) };
    default:
      return generic;
  }
}

function rateLimitMessage(retryAfter: number | undefined): string {
  const sent = "You have sent several messages already.";
  if (retryAfter === undefined) {
    return `${sent} Please try again later.`;
  }
  const minutes = Math.ceil(retryAfter / 60);
  return minutes <= 1
    ? `${sent} Please try again in a minute.`
    : `${sent} Please try again in ${minutes} minutes.`;
}
