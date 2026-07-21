import { useRef, useState } from 'react';
import { Send, Smile } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { EmojiPicker } from '@/components/chat/EmojiPicker';
import { getErrorMessage } from '@/utils/errorMessage';
import { cn } from '@/utils/cn';

export function MessageInput({ onSend, isSending, onTypingStart, onTypingStop }) {
  const [value, setValue] = useState('');
  const [justSent, setJustSent] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const textareaRef = useRef(null);

  const handleChange = (e) => {
    const next = e.target.value;
    setValue(next);
    if (next.trim()) {
      onTypingStart?.();
    } else {
      onTypingStop?.();
    }
  };

  const handleSend = async () => {
    const content = value.trim();
    if (!content || isSending) return;
    setValue('');
    onTypingStop?.();
    try {
      await onSend(content);
      setJustSent(true);
      setTimeout(() => setJustSent(false), 220);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Message could not be sent.'));
      setValue(content); // restore so the user doesn't lose what they typed
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Inserts at the cursor (not just appended to the end) so picking an
  // emoji mid-sentence lands where the caret actually is.
  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + emoji + value.slice(end);
    setValue(next);
    onTypingStart?.();
    setEmojiPickerOpen(false);

    // Restore focus + move the caret to just after the inserted emoji.
    // Has to wait a tick for React to flush the new value into the DOM.
    requestAnimationFrame(() => {
      textarea?.focus();
      const cursor = start + emoji.length;
      textarea?.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <div className="flex items-end gap-2 border-t border-border p-3">
      <div className="relative shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setEmojiPickerOpen((prev) => !prev)}
          aria-label="Insert emoji"
          aria-haspopup="dialog"
          aria-expanded={emojiPickerOpen}
        >
          <Smile className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </Button>
        {emojiPickerOpen && (
          <div className="absolute bottom-full left-0 mb-2 z-20">
            <EmojiPicker onSelect={insertEmoji} onClose={() => setEmojiPickerOpen(false)} />
          </div>
        )}
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message…"
        rows={1}
        aria-label="Message"
        className="max-h-32 flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button
        type="button"
        size="icon"
        onClick={handleSend}
        disabled={!value.trim()}
        isLoading={isSending}
        aria-label="Send message"
        className={cn(justSent && 'animate-bubble-pop')}
      >
        {!isSending && <Send className="h-4 w-4" aria-hidden="true" />}
      </Button>
    </div>
  );
}
