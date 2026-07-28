import { useRef, useState } from 'react';
import { Paperclip, Send, Smile } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { EmojiPicker } from '@/components/chat/EmojiPicker';
import { AttachmentPreview } from '@/components/chat/AttachmentPreview';
import { MEDIA_FILE_INPUT_ACCEPT } from '@/utils/fileMeta';
import { getErrorMessage } from '@/utils/errorMessage';
import { cn } from '@/utils/cn';

const TEXTAREA_MAX_HEIGHT_PX = 160;

export function MessageInput({ onSend, isSending, onTypingStart, onTypingStop, attachment }) {
  const [value, setValue] = useState('');
  const [justSent, setJustSent] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const attachmentItems = attachment?.items ?? [];
  const hasAttachment = attachmentItems.length > 0;
  const isBusy = isSending || attachment?.isUploading;

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, TEXTAREA_MAX_HEIGHT_PX)}px`;
  };

  const handleChange = (e) => {
    const next = e.target.value;
    setValue(next);
    autoResize();
    if (next.trim()) {
      onTypingStart?.();
    } else {
      onTypingStop?.();
    }
  };

  const resetTextareaHeight = () => {
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleSend = async () => {
    const content = value.trim();
    if ((!content && !hasAttachment) || isBusy) return;

    onTypingStop?.();

    // Attachments (with an optional caption on the last one) take a
    // different upload path than a plain text message — each file is
    // sent as its own message.
    if (hasAttachment) {
      setValue('');
      resetTextareaHeight();
      const sent = await attachment.sendAll(content || undefined);
      // Any files that failed stay in the attachment strip (marked with
      // a retry affordance) — only restore the caption if nothing at all
      // went through, so it's not lost.
      if (sent.length === 0) setValue(content);
      return;
    }

    setValue('');
    resetTextareaHeight();
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

  const handleFileChange = (e) => {
    if (e.target.files?.length) attachment?.pickFiles(e.target.files);
    // Reset so picking the same file(s) again after removing still fires onChange.
    e.target.value = '';
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
      autoResize();
    });
  };

  return (
    <div>
      {attachment && (
        <AttachmentPreview
          items={attachmentItems}
          onRemove={attachment.removeFile}
          onCancel={attachment.cancel}
          onRetry={handleSend}
        />
      )}

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

        {attachment && (
          <div className="shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={MEDIA_FILE_INPUT_ACCEPT}
              onChange={handleFileChange}
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={attachment?.isUploading}
              aria-label={hasAttachment ? 'Attach more files' : 'Attach files'}
            >
              <Paperclip className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </Button>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={hasAttachment ? 'Add a caption…' : 'Type a message…'}
          rows={1}
          aria-label="Message"
          className="max-h-40 flex-1 resize-none overflow-y-auto rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={!value.trim() && !hasAttachment}
          isLoading={isBusy}
          aria-label="Send message"
          className={cn(justSent && 'animate-bubble-pop')}
        >
          {!isBusy && <Send className="h-4 w-4" aria-hidden="true" />}
        </Button>
      </div>
    </div>
  );
}
