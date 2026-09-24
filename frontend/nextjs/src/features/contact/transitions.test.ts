import { describe, expect, it } from "vitest";

import { allowedTransitions, statusFilter, transitionLabel } from "./transitions";

describe("allowedTransitions", () => {
  it("offers the moves the contract allows", () => {
    expect(allowedTransitions("NEW")).toEqual(["IN_PROGRESS", "RESOLVED"]);
    expect(allowedTransitions("IN_PROGRESS")).toEqual(["RESOLVED"]);
    expect(allowedTransitions("RESOLVED")).toEqual(["IN_PROGRESS"]);
  });

  it("never offers the status a message already has", () => {
    for (const status of ["NEW", "IN_PROGRESS", "RESOLVED"] as const) {
      expect(allowedTransitions(status)).not.toContain(status);
    }
  });

  it("does not offer going back to new, which the workflow has no move for", () => {
    expect(allowedTransitions("IN_PROGRESS")).not.toContain("NEW");
    expect(allowedTransitions("RESOLVED")).not.toContain("NEW");
  });
});

describe("transitionLabel", () => {
  it("calls the move out of RESOLVED a reopen", () => {
    expect(transitionLabel("RESOLVED", "IN_PROGRESS")).toBe("Reopen");
    expect(transitionLabel("NEW", "IN_PROGRESS")).toBe("Start");
    expect(transitionLabel("NEW", "RESOLVED")).toBe("Resolve");
  });
});

describe("statusFilter", () => {
  it("keeps the statuses the contract defines", () => {
    expect(statusFilter("NEW")).toEqual(["NEW"]);
    expect(statusFilter(["NEW", "RESOLVED"])).toEqual(["NEW", "RESOLVED"]);
  });

  it("drops anything else, so the API is never asked for a status that isn't one", () => {
    expect(statusFilter("DELETED")).toEqual([]);
    expect(statusFilter(["NEW", "'; DROP TABLE"])).toEqual(["NEW"]);
    expect(statusFilter(undefined)).toEqual([]);
    expect(statusFilter("")).toEqual([]);
  });
});
