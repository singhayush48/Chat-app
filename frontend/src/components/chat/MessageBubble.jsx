import { useEffect, useRef, useState } from 'react';
import { MoreVertical, Pencil, Trash2, Check, CheckCheck, X as XIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { formatMessageTime, formatFullTimestamp, wasEdited } from '@/utils/formatTime';
import { getErrorMessage } from '@/utils/errorMessage';
import { normalizeMessageStatus } from '@/utils/messageStatus';
import { cn } from '@/utils/cn';

/** Small WhatsApp/Telegram-style sent/delivered/seen indicator, own messages only. */
function StatusTicks({ status, className }) {
  const normalized = normalizeMessageStatus(status);
  if (normalized === 'sent') {
    return <Check className={cn('h-3 w-3', className)} aria-label="Sent" />;
  }
  return (
    <CheckCheck
      className={cn('h-3 w-3', normalized === 'seen' && 'text-sky-400', className)}
      aria-label={normalized === 'seen' ? 'Seen' : 'Delivered'}
    />
  );
}

export function MessageBubble({ message, isOwn, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef(null);
  const textareaRef = useRef(null);
  const messageId = message.message_id ?? message.id;
  const isDeleted = Boolean(message.is_deleted);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(draft.length, draft.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const startEdit = () => {
    setDraft(message.content);
    setIsEditing(true);
    setMenuOpen(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDraft(message.content);
  };

  const saveEdit = async () => {
    const content = draft.trim();
    if (!content || content === message.content) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onEdit(messageId, content);
      setIsEditing(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save your edit.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(messageId);
      setConfirmDeleteOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete that message.'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (isDeleted) {
    return (
      <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
        <div
          className={cn(
            'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm italic text-muted-foreground',
            'border border-dashed border-border bg-transparent',
            isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'
          )}
        >
          This message was deleted.
        </div>
      </div>
    );
  }

  return (
    <div className={cn('group flex items-center gap-1', isOwn ? 'justify-end' : 'justify-start')}>
      {isOwn && !isEditing && (
        <div ref={menuRef} className="relative shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Message actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MoreVertical className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute bottom-full right-0 z-10 mb-1 w-36 overflow-hidden rounded-lg border border-border bg-surface shadow-2xl animate-scale-in origin-bottom-right"
            >
              <button
                type="button"
                role="menuitem"
                onClick={startEdit}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-surface-elevated"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                Edit
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmDeleteOpen(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-destructive transition-colors hover:bg-surface-elevated"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      <div className={cn('flex max-w-[75%] flex-col', isOwn ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2 text-sm shadow-sm animate-message-in',
            isOwn
              ? 'rounded-br-sm bg-primary text-primary-foreground'
              : 'rounded-bl-sm bg-surface-elevated text-foreground'
          )}
        >
          {isEditing ? (
            <div className="min-w-[10rem] space-y-2">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleEditKeyDown}
                rows={1}
                aria-label="Edit message"
                className="w-full resize-none rounded-md border border-primary-foreground/30 bg-transparent px-2 py-1 text-sm text-primary-foreground placeholder:text-primary-foreground/60 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={cancelEdit}
                  aria-label="Cancel edit"
                  className="rounded-md p-1 text-primary-foreground/80 transition-colors hover:bg-black/10"
                >
                  <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={isSaving}
                  aria-label="Save edit"
                  className="rounded-md p-1 text-primary-foreground/80 transition-colors hover:bg-black/10 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              <p
                title={formatFullTimestamp(message.created_at)}
                className={cn(
                  'mt-1 flex items-center justify-end gap-1 text-right text-[10px]',
                  isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                )}
              >
                {wasEdited(message) && <span>(Edited)</span>}
                {formatMessageTime(message.created_at)}
                {isOwn && <StatusTicks status={message.status} />}
              </p>
            </>
          )}
        </div>
      </div>

      <Modal
        open={confirmDeleteOpen}
        onClose={() => !isDeleting && setConfirmDeleteOpen(false)}
        title="Delete message?"
      >
        <p className="text-sm text-muted-foreground">
          This can&apos;t be undone. The message will be replaced with
          &ldquo;This message was deleted.&rdquo;
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmDeleteOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={confirmDelete} isLoading={isDeleting}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
