import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from '@/constants/endpoints';

export const messagesApi = {
  send: async ({ conversationId, content }) => {
    const { data } = await axiosInstance.post(ENDPOINTS.MESSAGES.SEND, {
      conversationId,
      content,
    });
    return data.data; // backend returns { success, message, data: <messageRow> }
  },

  /**
   * Uploads a media file (image/video/audio/document/zip) as a message.
   * `content` is an optional caption sent alongside the file. Progress and
   * cancellation are both optional — pass an AbortController's `signal` to
   * make the upload cancelable, and `onUploadProgress` (an axios progress
   * event handler) to drive a progress bar.
   */
  sendMedia: async ({ conversationId, file, content, onUploadProgress, signal }) => {
    const formData = new FormData();
    formData.append('media', file);
    formData.append('conversationId', conversationId);
    if (content) formData.append('content', content);

    const { data } = await axiosInstance.post(ENDPOINTS.MESSAGES.SEND_MEDIA, formData, {
      onUploadProgress,
      signal,
      // The shared axios instance defaults to 'Content-Type: application/json'
      // (see api/axiosInstance.js). Left as-is, axios sees that header and
      // JSON.stringifies the FormData instead of sending it as multipart —
      // the backend then gets no file at all. Clearing it here lets the
      // browser set 'multipart/form-data; boundary=...' itself.
      headers: { 'Content-Type': undefined },
    });
    return data.message; // backend returns { success, message: <messageRow> }
  },

  getByConversation: async (conversationId) => {
    const { data } = await axiosInstance.get(
      ENDPOINTS.MESSAGES.BY_CONVERSATION(conversationId)
    );
    return data.conversation; // backend key is `conversation`, holds the message rows
  },

  edit: async (messageId, content) => {
    await axiosInstance.patch(ENDPOINTS.MESSAGES.EDIT(messageId), { content });
    // Backend only returns { success, message } (no updated row), so the
    // caller applies the new content/edited state to local state itself.
  },

  remove: async (messageId) => {
    await axiosInstance.delete(ENDPOINTS.MESSAGES.DELETE(messageId));
  },
};
