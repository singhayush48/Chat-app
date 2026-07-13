/** Client-side route paths, kept in one place to avoid magic strings. */
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  HOME: '/',
  CONVERSATION: (conversationId) => `/c/${conversationId}`,
  NOT_FOUND: '*',
};
