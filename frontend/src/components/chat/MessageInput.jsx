import { useState } from 'react';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/utils/errorMessage';
import { cn } from '@/utils/cn';

export function MessageInput({ onSend, isSending }) {
  const [value, setValue] = useState('');
  const [justSent, setJustSent] = useState(false);

  const handleSend = async () => {
    const content = value.trim();
    if (!content || isSending) return;
    setValue('');
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

  return (
    <div className="flex items-end gap-2 border-t border-border p-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
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
