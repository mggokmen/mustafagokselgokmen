/**
 * What the contact form knows after a submission. A `"use server"` module may only export async
 * functions, so the shape and its empty value live here.
 */
export interface ContactFormState {
  /** One message per field, keyed by the field's name in the form. */
  errors?: Record<string, string>;
  /** Something the whole form has to say: a rate limit, or a failure that isn't the input's fault. */
  message?: string;
  sent?: boolean;
}

export const EMPTY_FORM_STATE: ContactFormState = {};
