/**
 * Centralized API endpoint paths.
 *
 * Two categories in here, clearly separated:
 *
 * 1) VERIFIED — matches the actual backend routes as confirmed against the
 *    provided source code. The backend mounts three different base paths:
 *      /user       -> auth mutations (register/login/logout) + user search
 *      /api/auth   -> current user, all users, conversations list
 *      /api        -> conversation creation, single conversation (messages), sending a message
 *
 * 2) PLANNED (not implemented on the backend yet) — designed so the
 *    frontend can be wired against them now. These will 404 until the
 *    backend implements them. Each one lists the exact method, body, and
 *    expected response shape to implement.
 */

export const ENDPOINTS = {
  AUTH: {
    REGISTER: '/user/register', // POST { username, phone, email, password }
    LOGIN: '/user/login', // POST { email, password } -> sets httpOnly cookie "token"
    LOGOUT: '/user/logout', // POST
    ME: '/api/auth/me', // GET (protected)
  },
  USERS: {
    ALL: '/api/auth/users', // GET (protected)
    SEARCH: '/user/search', // GET (protected) ?name=<query>  (NOT ?q=)

    // --- PLANNED, backend TODO --------------------------------------
    // PATCH /api/users/me
    //   body:  { username?, phone?, bio? }
    //   200 -> { user: { user_id, username, phone, email, bio, profile_pic } }
    // The `users` table already has `bio` and `profile_pic` columns
    // (used by /user/search), so this is just wiring a route + controller
    // to an UPDATE query — no schema change needed.
    UPDATE_ME: '/api/users/me',

    // POST /api/users/me/avatar  (multipart/form-data, field name: "avatar")
    //   200 -> { user: { ...same shape as above, profile_pic: <new url> } }
    UPDATE_AVATAR: '/api/users/me/avatar',
    // ------------------------------------------------------------------
  },
  CONVERSATIONS: {
    CREATE: '/api/conversation', // POST (protected) { userId, username }
    LIST: '/api/auth/conversations', // GET (protected)
    // --- PLANNED enrichment, backend TODO ------------------------------
    // Today this returns bare `conversations` rows (conversation_id, type,
    // created_by, created_at, updated_at) with NO participant info and NO
    // last message, because there's no join back to conversation_members
    // or messages. There is currently no way for the client to know who a
    // conversation is with after a page refresh.
    //
    // Ask: have this same GET /api/auth/conversations return, per row:
    //   {
    //     conversation_id, type, created_at, updated_at,
    //     other_user: { user_id, username, profile_pic } | null,
    //     last_message: { content, sender_id, created_at } | null
    //   }
    // The frontend (see hooks/useConversations.js) already checks for
    // `other_user`/`last_message` and will pick them up automatically —
    // no frontend changes needed once this ships.
    // ------------------------------------------------------------------
  },
  MESSAGES: {
    SEND: '/api/message', // POST (protected) { conversationId, content }
    BY_CONVERSATION: (conversationId) => `/api/conversation/${conversationId}`, // GET (protected)
  },
};
