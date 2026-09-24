import type { components } from "./schema";

/**
 * The API's models, named after the contract. Nothing in the app declares its own copy of a shape
 * the contract already defines (docs/frontend/nextjs.md).
 */
export type Problem = components["schemas"]["Problem"];
export type FieldError = components["schemas"]["FieldError"];
export type TokenResponse = components["schemas"]["TokenResponse"];
export type User = components["schemas"]["UserResponse"];
export type UserSummary = components["schemas"]["UserSummary"];
export type Role = components["schemas"]["Role"];
export type ContactMessage = components["schemas"]["ContactMessageResponse"];
export type ContactMessagePage = components["schemas"]["ContactMessagePage"];
export type ContactMessageStatus = components["schemas"]["ContactMessageStatus"];
