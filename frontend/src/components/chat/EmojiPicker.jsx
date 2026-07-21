import { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';

// A curated set rather than the full Unicode emoji list — keeps the
// bundle tiny and avoids pulling in an external emoji-data package.
const EMOJI_CATEGORIES = [
  {
    label: 'Smileys',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '😘', '😋', '😛', '😜', '🤪',
      '🤨', '🧐', '😎', '🥳', '😏', '😴', '🤔', '🤗', '🙄', '😶',
      '😐', '😑', '😯', '😲', '😳', '🥺', '😢', '😭', '😤', '😡',
    ],
  },
  {
    label: 'Gestures',
    emojis: [
      '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘',
      '👌', '🤌', '👈', '👉', '👆', '👇', '☝️', '👋', '🤙', '💪',
      '🙏', '🤝', '👏', '🙌', '👐', '🫶',
    ],
  },
  {
    label: 'Hearts',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
    ],
  },
  {
    label: 'Fun',
    emojis: [
      '🔥', '✨', '🎉', '🎊', '💯', '⭐', '🌟', '⚡', '💥', '🎈',
      '🎁', '🏆', '🥇', '☕', '🍕', '🎵', '📌', '✅', '❌', '❓',
    ],
  },
];

/**
 * Popover emoji grid. Closes on outside click / Escape. `onSelect`
 * receives the emoji string — the caller decides where it goes (see
 * MessageInput's cursor-position insert).
 */
export function EmojiPicker({ onSelect, onClose, className }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Emoji picker"
      className={cn(
        'w-72 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-scale-in origin-bottom-right',
        className
      )}
    >
      <div className="flex border-b border-border">
        {EMOJI_CATEGORIES.map((category, index) => (
          <button
            key={category.label}
            type="button"
            onClick={() => setActiveCategory(index)}
            className={cn(
              'flex-1 px-2 py-2 text-[11px] font-medium transition-colors',
              index === activeCategory
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {category.label}
          </button>
        ))}
      </div>
      <div className="grid max-h-48 grid-cols-8 gap-0.5 overflow-y-auto p-2">
        {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            aria-label={emoji}
            className="rounded-md p-1 text-lg leading-none transition-colors hover:bg-surface-elevated"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
