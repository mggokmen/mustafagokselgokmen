"use client";

import { useActionState } from "react";

import type { ContactMessage, ContactMessageStatus } from "@/lib/api/types";
import { EMPTY_STATUS_STATE } from "./form-state";
import { changeStatus } from "./status-actions";
import { allowedTransitions, transitionLabel } from "./transitions";

/**
 * One form per message. The version it carries is the one that was rendered, which is what lets
 * the backend refuse a change made against a message that has since moved on.
 */
export function StatusForm({ message }: { message: ContactMessage }) {
  const [state, action, pending] = useActionState(changeStatus, EMPTY_STATUS_STATE);
  const moves = allowedTransitions(message.status);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={message.id} />
      <input type="hidden" name="version" value={message.version} />
      <div className="flex flex-wrap gap-2">
        {moves.map((to: ContactMessageStatus) => (
          <button
            key={to}
            type="submit"
            name="status"
            value={to}
            disabled={pending}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-900"
          >
            {transitionLabel(message.status, to)}
          </button>
        ))}
      </div>
      {state.message !== undefined && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {state.message}
        </p>
      )}
    </form>
  );
}
