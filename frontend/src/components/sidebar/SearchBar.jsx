import { useEffect, useRef, useState } from 'react';
import { Search, X, Loader2, UserSearch } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '@/api/usersApi';
import { conversationsApi } from '@/api/conversationsApi';
import { Avatar } from '@/components/common/Avatar';
import { useDebounce } from '@/hooks/useDebounce';
import { useConversation } from '@/hooks/useConversation';
import { getErrorMessage } from '@/utils/errorMessage';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);
  const debouncedQuery = useDebounce(query, 350);
  const navigate = useNavigate();
  const { setActiveConversationId } = useConversation();

  useEffect(() => {
    let isMounted = true;

    async function run() {
      if (!debouncedQuery.trim()) {
        await Promise.resolve();
        if (isMounted) setResults([]);
        return;
      }
      await Promise.resolve();
      if (isMounted) setIsSearching(true);
      try {
        const users = await usersApi.search(debouncedQuery.trim());
        if (isMounted) setResults(users ?? []);
      } catch (err) {
        if (isMounted) toast.error(getErrorMessage(err, 'Search failed.'));
      } finally {
        if (isMounted) setIsSearching(false);
      }
    }

    run();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectUser = async (targetUser) => {
    setIsCreating(true);
    try {
      const { conversationId } = await conversationsApi.create({
        userId: targetUser.user_id,
        username: targetUser.username,
      });
      setActiveConversationId(conversationId);
      setQuery('');
      setResults([]);
      setIsFocused(false);
      navigate(`/c/${conversationId}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not start that conversation.'));
    } finally {
      setIsCreating(false);
    }
  };

  const showDropdown = isFocused && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative border-b border-border p-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search people…"
          aria-label="Search for people to message"
          className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-3 right-3 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-surface shadow-2xl animate-scale-in origin-top">
          {isSearching ? (
            <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Searching…
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <UserSearch className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">No people found for &ldquo;{query.trim()}&rdquo;.</p>
            </div>
          ) : (
            <ul role="listbox">
              {results.map((person) => (
                <li key={person.user_id}>
                  <button
                    type="button"
                    disabled={isCreating}
                    onClick={() => handleSelectUser(person)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-elevated disabled:opacity-50"
                  >
                    <Avatar name={person.username} src={person.profile_pic} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {person.username}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{person.email}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
