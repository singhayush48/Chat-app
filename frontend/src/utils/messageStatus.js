/**
 * The `messages.status` column is written inconsistently by the backend
 * ("DELIVERED" uppercase, "seen" lowercase, and a DB-default value for
 * brand new rows that this app never assumes the exact casing of). This
 * normalizes any of that into one of 'sent' | 'delivered' | 'seen' so the
 * UI has one consistent thing to branch on.
 */
export function normalizeMessageStatus(status) {
  const normalized = String(status ?? '').toLowerCase();
  if (normalized === 'seen' || normalized === 'delivered') return normalized;
  return 'sent';
}
