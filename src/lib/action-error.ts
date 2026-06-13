/**
 * Map an error to a safe, generic message for the client while logging the real
 * cause server-side.
 *
 * Admin actions are owner-only, but returning raw Postgres/PostgREST
 * `error.message` still leaks schema internals (table, column, and constraint
 * names) and makes for brittle UX. Action handlers return `actionError(error)`
 * instead of `error.message`.
 */
export function actionError(
  error: unknown,
  fallback = "Something went wrong — please try again.",
): string {
  console.error("[admin action]", error);
  return fallback;
}
