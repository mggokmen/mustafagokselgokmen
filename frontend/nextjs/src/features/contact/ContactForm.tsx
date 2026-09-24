"use client";

import { useActionState } from "react";

import { sendContactMessage } from "./actions";
import { EMPTY_FORM_STATE } from "./form-state";
import { MESSAGE_MAX_LENGTH, SUBJECT_MAX_LENGTH } from "./schemas";

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, EMPTY_FORM_STATE);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="subject" className="text-sm font-medium">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          maxLength={SUBJECT_MAX_LENGTH}
          aria-describedby={state.errors?.["subject"] ? "subject-error" : undefined}
          aria-invalid={state.errors?.["subject"] !== undefined}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        {state.errors?.["subject"] !== undefined && (
          <p id="subject-error" className="text-sm text-red-700 dark:text-red-400">
            {state.errors["subject"]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="message" className="text-sm font-medium">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          maxLength={MESSAGE_MAX_LENGTH}
          aria-describedby={state.errors?.["message"] ? "message-error" : undefined}
          aria-invalid={state.errors?.["message"] !== undefined}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        {state.errors?.["message"] !== undefined && (
          <p id="message-error" className="text-sm text-red-700 dark:text-red-400">
            {state.errors["message"]}
          </p>
        )}
      </div>

      {state.message !== undefined && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {state.message}
        </p>
      )}

      {state.sent === true && (
        <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          Your message has been sent.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
