import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { validateMediaFile } from '@/utils/fileMeta';
import { getErrorMessage } from '@/utils/errorMessage';

const MAX_PENDING_FILES = 10;
let nextId = 0;

/**
 * Owns the pending-attachments lifecycle for a conversation's
 * MessageInput: picking multiple files at once (via the paperclip button
 * or drag-and-drop), previewing each, uploading with per-file progress,
 * and canceling/removing individually.
 *
 * Lives in ChatConversation (alongside useMessages/useMessageSearch) so
 * both the input's file picker and the conversation-wide drop zone can
 * share the same pending file list.
 *
 * The backend only accepts one file per message (multer's
 * `.single('media')`), so sending N files sends N separate messages —
 * same as WhatsApp/Telegram's "send as separate messages" behavior for a
 * multi-select. They're uploaded one at a time (not in parallel) so
 * upload order matches send order and one big file doesn't starve the
 * others' progress bars of bandwidth.
 */
export function useMediaAttachment(sendMedia) {
  const [items, setItems] = useState([]);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const revokeItem = (item) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  };

  const removeFile = useCallback((id) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) {
        target.abortController?.abort();
        revokeItem(target);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    itemsRef.current.forEach((item) => {
      item.abortController?.abort();
      revokeItem(item);
    });
    setItems([]);
  }, []);

  const pickFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList ?? []);
    if (incoming.length === 0) return;

    setItems((prev) => {
      const room = MAX_PENDING_FILES - prev.length;
      if (room <= 0) {
        toast.error(`You can attach up to ${MAX_PENDING_FILES} files at once.`);
        return prev;
      }

      const accepted = [];
      incoming.slice(0, room).forEach((file) => {
        const { ok, reason } = validateMediaFile(file);
        if (!ok) {
          toast.error(reason);
          return;
        }
        let previewUrl = null;
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          previewUrl = URL.createObjectURL(file);
        }
        accepted.push({
          id: `att-${nextId++}`,
          file,
          previewUrl,
          progress: 0,
          isUploading: false,
          error: null,
          abortController: null,
        });
      });

      if (incoming.length > room) {
        toast.error(`Only ${room} more file(s) can be attached (max ${MAX_PENDING_FILES}).`);
      }

      return [...prev, ...accepted];
    });
  }, []);

  const cancel = useCallback((id) => {
    itemsRef.current.find((i) => i.id === id)?.abortController?.abort();
  }, []);

  const updateItem = (id, patch) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  /**
   * Uploads every pending file as its own message, in order. `caption`
   * (if any) is attached only to the LAST file — mirrors how most chat
   * apps handle "type a caption, attach 3 photos": one caption for the
   * batch, shown under the final image.
   *
   * Files that fail stay in the list (marked with an error) so the user
   * can see what didn't go through and retry just those; successfully
   * sent files are removed as they complete.
   */
  const sendAll = useCallback(
    async (caption) => {
      const pending = itemsRef.current.filter((i) => !i.isUploading);
      if (pending.length === 0) return [];

      const sent = [];
      for (let index = 0; index < pending.length; index += 1) {
        const item = pending[index];
        const isLast = index === pending.length - 1;
        const controller = new AbortController();
        updateItem(item.id, { isUploading: true, progress: 0, error: null, abortController: controller });

        try {
          const message = await sendMedia(item.file, isLast ? caption : undefined, {
            signal: controller.signal,
            onUploadProgress: (event) => {
              if (!event.total) return;
              updateItem(item.id, { progress: Math.round((event.loaded / event.total) * 100) });
            },
          });
          sent.push(message);
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
          setItems((prev) => prev.filter((i) => i.id !== item.id));
        } catch (err) {
          const canceled = err?.code === 'ERR_CANCELED';
          updateItem(item.id, {
            isUploading: false,
            error: canceled ? null : getErrorMessage(err, 'Upload failed. Tap to retry.'),
          });
          if (!canceled) {
            toast.error(getErrorMessage(err, `"${item.file.name}" failed to send.`));
          }
          if (canceled) {
            // Canceled explicitly — drop it instead of leaving an error state.
            setItems((prev) => prev.filter((i) => i.id !== item.id));
          }
        }
      }

      return sent;
    },
    [sendMedia]
  );

  // Revoke any outstanding object URLs on unmount to avoid leaking memory.
  useEffect(() => () => {
    itemsRef.current.forEach(revokeItem);
  }, []);

  const isUploading = items.some((i) => i.isUploading);

  return { items, isUploading, pickFiles, removeFile, clear, cancel, sendAll };
}
