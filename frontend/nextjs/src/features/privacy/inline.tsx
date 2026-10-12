import { Fragment } from "react";

/**
 * The privacy copy needs two kinds of emphasis and nothing else: a code span for a cookie or a
 * claim name, and bold for a third party's name. Rather than splitting every sentence into a tree
 * of objects in two languages, the copy carries `**bold**` and `` `code` `` and this turns them
 * into elements.
 *
 * It is deliberately not a Markdown renderer: nothing here produces HTML from text, so there is
 * no path from a string to markup beyond these two cases (docs/security.md#xss).
 */
const PATTERN = /(\*\*[^*]+\*\*|`[^`]+`)/g;

export function inline(text: string): React.ReactNode {
  return text.split(PATTERN).map((part, index) => {
    const key = `${index}-${part}`;

    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={key} className="rounded bg-slate-800 px-1 py-0.5 text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }

    return <Fragment key={key}>{part}</Fragment>;
  });
}
