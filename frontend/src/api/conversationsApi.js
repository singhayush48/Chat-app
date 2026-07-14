import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from '@/constants/endpoints';

export const conversationsApi = {
  /**
   * Backend requires both the target user's id AND username in the body
   * (not just the id), and returns 200 with the existing conversationId
   * if a private conversation between the two users already exists.
   */
  create: async ({ userId, username }) => {
    const { data } = await axiosInstance.post(ENDPOINTS.CONVERSATIONS.CREATE, {
      userId,
      username,
    });
    return data; // { message, conversationId }
  },

  /**
   * NOTE: this returns raw `conversations` table rows only
   * (conversation_id, type, created_by, created_at, updated_at) — no
   * participant name/avatar or last-message preview. The UI layer will
   * need to enrich this with data from usersApi.getAll() until the
   * backend adds that itself.
   */
  /**
   * NOTE: the backend's getAllConversations controller returns the raw
   * node-postgres query result instead of unwrapping it, i.e.
   *   { conversations: { rows: [...], rowCount, command, ... } }
   * instead of { conversations: [...] } — same pattern as authApi.getMe().
   * Unwrapped here so callers can always treat this as a plain array.
   */
  list: async () => {
    const { data } = await axiosInstance.get(ENDPOINTS.CONVERSATIONS.LIST);
    return data?.conversations ?? [];
},


};
