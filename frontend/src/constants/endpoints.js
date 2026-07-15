/**
 * Centralized API endpoint paths — matches the actual backend routes.
 * The backend mounts four different base paths:
 *   /user        -> auth mutations (register/login/logout) + user search
 *   /api/auth    -> current user, all users, conversations list
 *   /api         -> conversation creation, single conversation (messages), sending/editing/deleting a message
 *   /api/users   -> profile update, avatar upload, single-user online status
 */

export const ENDPOINTS = {
  AUTH: {
    REGISTER: '/user/register', // POST { username, phone, email, password }
    LOGIN: '/user/login', // POST { email, password } -> sets httpOnly cookie "token"
    LOGOUT: '/user/logout', // POST (protected — marks the user offline)
    ME: '/api/auth/me', // GET (protected)
  },
  USERS: {
    ALL: '/api/auth/users', // GET (protected)
    SEARCH: '/user/search', // GET (protected) ?name=<query>  (NOT ?q=)

    UPDATE_ME: '/api/users/me', // PATCH (protected) { username?, phone?, bio? }

    // multipart/form-data, field name "avatar". Response's profile_pic is
    // a server-relative path (e.g. "/uploads/xyz.jpg") — resolve against
    // the API origin, not the frontend origin (see utils/resolveUrl.js).
    UPDATE_AVATAR: '/api/users/me/avatar', // POST (protected)

    // Standalone status lookup for one user. Not used by the sidebar/chat
    // header today — those already get is_online/last_seen for free via
    // CONVERSATIONS.LIST's `other_user`. Kept here for any future feature
    // that needs to check a specific user outside a conversation context.
    STATUS: (userId) => `/api/users/${userId}/status`, // GET (protected) -> { is_online, last_seen }

    // Public profile lookup, used by the user profile drawer to fetch
    // bio/email (not included in the conversations list payload).
    BY_ID: (userId) => `/api/users/${userId}`, // GET (protected) -> { user }
  },
  CONVERSATIONS: {
    CREATE: '/api/conversation', // POST (protected) { userId, username }

    // Returns each conversation enriched with the other participant
    // (including is_online/last_seen) and a last_message preview:
    //   { conversation_id, type, created_at, updated_at,
    //     other_user: { user_id, username, profile_pic, is_online, last_seen } | null,
    //     last_message: { content, sender_id, created_at } | null }
    LIST: '/api/auth/conversations', // GET (protected)
  },
  MESSAGES: {
    SEND: '/api/message', // POST (protected) { conversationId, content }
    BY_CONVERSATION: (conversationId) => `/api/conversation/${conversationId}`, // GET (protected)
    EDIT: (messageId) => `/api/message/${messageId}`, // PATCH (protected) { content }
    DELETE: (messageId) => `/api/message/${messageId}`, // DELETE (protected)
  },
};
