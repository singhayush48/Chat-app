/** Formats a message timestamp: time-only today, weekday this week, else date. */
export function formatMessageTime(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Full, unambiguous timestamp for a message bubble's title/tooltip. */
export function formatFullTimestamp(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "last seen 5 minutes ago" / "last seen yesterday" style text. */
export function formatLastSeen(dateInput) {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'last seen just now';
  if (diffMinutes < 60) return `last seen ${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `last seen ${diffHours}h ago`;

  const isToday = date.toDateString() === new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isYesterday) {
    return `last seen yesterday at ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (!isToday) {
    return `last seen ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }
  return `last seen ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}
