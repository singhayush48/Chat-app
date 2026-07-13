# Chat App — Frontend

Dark-mode-only real-time chat frontend, integrated with the existing Express/PostgreSQL backend.

## Stack

React 19 · Vite · React Router DOM v7 · Axios · Tailwind CSS v4 · React Hook Form · React Hot Toast · Socket.IO Client (scaffolded, not yet connected) · ESLint

## Getting started

```bash
npm install
cp .env.example .env   # adjust VITE_API_BASE_URL if your backend isn't on :3000
npm run dev
```

Your backend needs CORS enabled for `http://localhost:5173` with `credentials: true` (already added in the version you sent).

## Project structure

```
src/
  api/          Axios instance + one service module per resource
  components/
    auth/       LoginForm, RegisterForm, EditProfileModal
    chat/       ChatHeader, MessageList, MessageBubble, MessageInput
    sidebar/    Sidebar, SearchBar, ConversationList, ConversationCard
    common/     Avatar, Navbar, ProfileCard, ErrorScreen, LoadingSkeleton,
                FullScreenLoader, OnlineStatusDot, TypingIndicator
    ui/         shadcn-style primitives: Button, Input, Label, Modal, FieldError
  constants/    Endpoint paths (verified + planned) and route paths
  context/      Auth, Theme, Conversation providers
  hooks/        useAuth, useTheme, useConversation, useConversations,
                useMessages, useDebounce
  layouts/      AuthLayout, HomeLayout (sidebar + main pane, responsive)
  pages/        Route-level components, lazy-loaded
  routes/       ProtectedRoute, PublicRoute, AppRoutes
  services/     Socket.IO scaffold (not connected)
  utils/        cn(), error-message mapping, auth event bus, initials,
                avatar color, time formatting
```

## Routing

```
/login              public
/register            public
/                    protected, shows EmptyChatScreen (nothing selected)
/c/:conversationId   protected, full chat view
*                    404
```

Sidebar and chat pane share one responsive layout: both show side-by-side
on desktop/tablet; on mobile only one shows at a time, with a back button
in the chat header to return to the conversation list.

## Backend integration — verified vs. planned

`src/constants/endpoints.js` is the single source of truth and documents
every route in two groups:

- **Verified** — matches your actual backend exactly, including its quirks
  (e.g. `?name=` not `?q=` for search, `GET /api/auth/me` returning a raw
  pg query result that's unwrapped in `authApi.getMe`).
- **Planned** — routes the backend doesn't have yet, added because the UI
  needs them and you said you'd build the backend after. Each one lists
  the exact method, request body, and expected response shape:
  - `PATCH /api/users/me` — update username/phone/bio (the `users` table
    already has `bio` and `profile_pic` columns from `searchUser`, so this
    is just wiring an UPDATE query to a route).
  - `POST /api/users/me/avatar` — multipart upload, field name `avatar`.
  - **Enrichment of `GET /api/auth/conversations`** (same route, richer
    response) — today it returns bare rows with no participant info and
    no last message, so there's currently no way to know who a
    conversation is with after a refresh. The planned shape adds
    `other_user` and `last_message` per row; the frontend already checks
    for these fields and will use them automatically once added — no
    frontend changes needed.

Until that enrichment ships, conversation cards show a generic label
("Conversation") instead of the other person's name — this is intentional
(no fake data), not a bug. Everything else (opening a conversation,
reading/sending messages) works fully today.

## Known backend items worth a look (not fixed here — frontend only)

- `getAllUsers` and `getUserById` both do `SELECT * FROM users`, which
  includes the hashed password in the API response. Worth trimming to an
  explicit column list (like `searchUser` already does) when you're back
  in that code.
- The unused `updateUser(id, name, age, sex, address)` in `userModel.js`
  doesn't match the real `users` schema (`username/phone/email/bio/profile_pic`)
  — dead code, safe to delete or repurpose for the planned `PATCH /api/users/me`.

## What's built

**Phase 1** — project setup, folder architecture, Axios instance + interceptors, API service layer, AuthContext/ThemeContext/ConversationContext, routing skeleton, protected/public route guards.

**Phase 2** — Login and Register forms (React Hook Form, client-side validation, password visibility toggle, specific error messages per backend response).

**Phase 3** — Navbar with profile dropdown, SearchBar (debounced user search → create conversation → navigate), ConversationList with loading/error/empty states.

**Phase 4** — ChatHeader, MessageList (auto-scroll, skeleton, empty state), MessageBubble (own vs. other alignment, timestamps), MessageInput (Enter to send, Shift+Enter for newline, optimistic append).

**Phase 5 highlights already included** — responsive mobile/tablet/desktop layout, lazy-loaded routes, toasts, focus-visible states and ARIA labels throughout, dark theme with glassmorphism accents on the auth cards.

Typing indicator and online-status dot are built as components but intentionally render nothing live — there's no presence data from the backend yet (would need the Socket.IO connection, which per the original spec is scaffolded in `services/socket.js` but not turned on).
