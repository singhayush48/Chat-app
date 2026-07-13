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
};
