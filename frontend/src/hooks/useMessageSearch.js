import { useEffect, useMemo, useState } from 'react';

/**
 * Client-side search over an already-loaded conversation's messages.
 * There's no backend search endpoint (and none is needed) since
 * getConversationById returns full history up front — this just filters
 * the array that's already in memory and tracks which match is "active"
 * for prev/next navigation.
 */
export function useMessageSearch(messages) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return messages.filter((m) => !m.is_deleted && m.content?.toLowerCase().includes(q));
  }, [messages, query]);

  // Jump back to the first result whenever the query (or the underlying
  // message set) changes, rather than pointing at a now-unrelated index.
  useEffect(() => {
    let isMounted = true;
    async function reset() {
      await Promise.resolve();
      if (isMounted) setActiveIndex(0);
    }
    reset();
    return () => {
      isMounted = false;
    };
  }, [query, messages]);

  const activeMessage = matches.length > 0 ? matches[activeIndex % matches.length] : null;

  const goNext = () => {
    if (matches.length === 0) return;
    setActiveIndex((i) => (i + 1) % matches.length);
  };

  const goPrev = () => {
    if (matches.length === 0) return;
    setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
  };

  const clear = () => {
    setQuery('');
    setActiveIndex(0);
  };

  return {
    query,
    setQuery,
    matchCount: matches.length,
    activeMatchNumber: matches.length > 0 ? (activeIndex % matches.length) + 1 : 0,
    activeMessage,
    goNext,
    goPrev,
    clear,
  };
}
