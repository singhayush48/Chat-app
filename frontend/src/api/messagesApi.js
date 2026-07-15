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
