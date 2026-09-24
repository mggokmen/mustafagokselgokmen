import type { ContactMessageStatus } from "@/lib/api/types";

/**
 * The moves the workflow allows, as the contract states them
 * (docs/architecture.md#message-status). Offering only these keeps the admin from asking for
 * something the backend will refuse; the backend still decides, and answers 409 if it disagrees.
 */
const ALLOWED: Record<ContactMessageStatus, ContactMessageStatus[]> = {
  NEW: ["IN_PROGRESS", "RESOLVED"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["IN_PROGRESS"],
};

export const STATUS_LABELS: Record<ContactMessageStatus, string> = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
};

/** What the button for a move should say. */
export const TRANSITION_LABELS: Record<ContactMessageStatus, string> = {
  NEW: "Mark as new",
  IN_PROGRESS: "Start",
  RESOLVED: "Resolve",
};

export function allowedTransitions(from: ContactMessageStatus): ContactMessageStatus[] {
  return ALLOWED[from] ?? [];
}

export function transitionLabel(from: ContactMessageStatus, to: ContactMessageStatus): string {
  if (from === "RESOLVED" && to === "IN_PROGRESS") {
    return "Reopen";
  }
  return TRANSITION_LABELS[to];
}

export const ALL_STATUSES: ContactMessageStatus[] = ["NEW", "IN_PROGRESS", "RESOLVED"];

/** Statuses from the URL, which anyone can type anything into. */
export function statusFilter(value: string | string[] | undefined): ContactMessageStatus[] {
  const values = value === undefined ? [] : Array.isArray(value) ? value : [value];
  return values.filter((candidate): candidate is ContactMessageStatus =>
    (ALL_STATUSES as string[]).includes(candidate),
  );
}
