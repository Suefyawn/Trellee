/**
 * Shared validation for the public contact + booking forms.
 *
 * Pure, dependency-free, and free of any server-only imports, so the same rules
 * are unit-testable and could be reused on the client. Each validator returns a
 * human-readable error string, or `null` when the input is valid.
 */

// Pragmatic email shape check — not RFC-complete, just enough to catch typos
// and obviously-bad input before it reaches the database.
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Upper bounds, applied before the DB write to reject oversized/bot payloads.
export const FIELD_LIMITS = {
  name: 200,
  email: 320,
  company: 200,
  budget: 100,
  phone: 50,
  message: 5000,
  notes: 5000,
} as const;

const TOO_LONG = "One of the fields is too long.";

export function validateContact(input: {
  name?: string;
  email?: string;
  company?: string;
  budget?: string;
  message?: string;
}): string | null {
  if (!input.name?.trim()) return "Name is required.";
  if (!input.email?.trim()) return "Email is required.";
  if (!EMAIL_RE.test(input.email)) return "Please enter a valid email.";
  if (!input.message?.trim() || input.message.trim().length < 10)
    return "A few more words about the project, please.";
  if (
    input.name.length > FIELD_LIMITS.name ||
    input.email.length > FIELD_LIMITS.email ||
    (input.company?.length ?? 0) > FIELD_LIMITS.company ||
    (input.budget?.length ?? 0) > FIELD_LIMITS.budget ||
    (input.message?.length ?? 0) > FIELD_LIMITS.message
  )
    return TOO_LONG;
  return null;
}

export function validateBooking(input: {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  notes?: string;
}): string | null {
  if (!input.name?.trim()) return "Name is required.";
  if (!input.email?.trim()) return "Email is required.";
  if (!EMAIL_RE.test(input.email)) return "Please enter a valid email.";
  if (
    input.name.length > FIELD_LIMITS.name ||
    input.email.length > FIELD_LIMITS.email ||
    (input.company?.length ?? 0) > FIELD_LIMITS.company ||
    (input.phone?.length ?? 0) > FIELD_LIMITS.phone ||
    (input.notes?.length ?? 0) > FIELD_LIMITS.notes
  )
    return TOO_LONG;
  return null;
}
