"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createApiClient, unwrap } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import { requireAdmin } from "@/lib/auth/current-user";
import { readAccessToken } from "@/lib/auth/session";
import type { StatusFormState } from "./form-state";
import { ALL_STATUSES } from "./transitions";

/**
 * Moves a message to another status. Like every action, it authorizes itself: this runs as a POST
 * to the admin page's route, and route protection alone would not cover it.
 *
 * The version comes from the form, so the backend can tell that this decision was made about the
 * message as it was displayed. If it changed in between, the backend answers 409 and nothing is
 * overwritten (docs/database.md#transactions).
 */
export async function changeStatus(
  _previous: StatusFormState,
  formData: FormData,
): Promise<StatusFormState> {
  await requireAdmin("/admin/messages");

  const id = String(formData.get("id") ?? "");
  const version = Number(formData.get("version"));
  // Checked, not cast: this runs as a POST that anyone signed in as an admin can craft by hand,
  // so the status has to be one the contract defines.
  const status = ALL_STATUSES.find((candidate) => candidate === formData.get("status"));
  if (id === "" || status === undefined || !Number.isInteger(version) || version < 0) {
    return { message: "That message could not be updated. Please reload the page." };
  }

  const accessToken = await readAccessToken();
  let failure: unknown;
  try {
    unwrap(
      await createApiClient({ accessToken }).PUT(
        "/api/v1/contact-messages/{contactMessageId}/status",
        {
          params: { path: { contactMessageId: id } },
          body: { status, version },
        },
      ),
    );
  } catch (error) {
    failure = error;
  }

  if (failure !== undefined) {
    // Outside the catch: redirect works by throwing, and a catch would swallow it.
    if (failure instanceof ApiError && failure.status === 401) {
      redirect("/login?returnTo=%2Fadmin%2Fmessages");
    }
    // The list is reloaded either way: after a conflict it is the only way to see what it says now.
    revalidatePath("/admin/messages");
    return toStatusFormState(failure);
  }

  revalidatePath("/admin/messages");
  return { changed: true };
}

function toStatusFormState(error: unknown): StatusFormState {
  if (!(error instanceof ApiError)) {
    return { message: "That message could not be updated. Please try again." };
  }
  switch (error.code) {
    case "CONFLICT":
      // Either someone else changed it first, or this is not a transition the workflow allows.
      // The list has been reloaded, so what is on screen is current.
      return {
        message:
          "This message changed while you were looking at it, or that move isn't allowed. The list below is up to date.",
      };
    case "FORBIDDEN":
      return { message: "You are not allowed to change this message." };
    case "NOT_FOUND":
      return { message: "That message no longer exists." };
    default:
      return { message: "That message could not be updated. Please try again." };
  }
}
