/**
 * sockets/socket.js
 * ------------------
 * Single source of truth for everything Socket.IO in this app.
 *
 * Responsibilities:
 *   1. Attach Socket.IO to the shared HTTP server (`initSocket`).
 *   2. Authenticate every socket connection using the SAME httpOnly JWT
 *      cookie that `middleware/authMiddleware.js` uses for REST requests,
 *      so a browser tab is "logged in" identically on both transports.
 *   3. Track presence (who is online) in memory and keep `users.is_online`
 *      / `users.last_seen` in the database in sync.
 *   4. Provide small emit helpers (`emitToConversation`, `emitToUser`,
 *      `disconnectUserSockets`) that REST controllers call after they
 *      write to the database, so REST stays the single source of truth
 *      for persistence and Socket.IO stays the real-time delivery layer.
 *
 * Client -> Server events handled here:
 *   - "conversation:join"   { conversationId }
 *   - "conversation:leave"  { conversationId }
 *   - "typing:start"        { conversationId }
 *   - "typing:stop"         { conversationId }
 *   - "message:read"        { conversationId, messageId }
 *
 * Server -> Client events emitted here / from controllers:
 *   - "presence:online_contacts" { userIds: [...] }   (sent on connect)
 *   - "user:online"               { userId }
 *   - "user:offline"              { userId, lastSeen }
 *   - "conversation:joined"       { conversationId }
 *   - "conversation:error"        { message }
 *   - "typing:start"              { conversationId, userId }
 *   - "typing:stop"               { conversationId, userId }
 *   - "message:read"              { conversationId, messageId, userId }
 *   - "message:new"                { conversationId, message }   (from messageController)
 *   - "message:edited"             { conversationId, messageId, content } (from messageController)
 *   - "message:deleted"            { conversationId, messageId }          (from messageController)
 *   - "conversation:created"       { conversation }                       (from messageController)
 */

const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const dotenv = require("dotenv");
dotenv.config();

const userModel = require("../models/userModel");
const conversationModel = require("../models/conversationModel");

/** The Socket.IO server instance, set once initSocket() runs. */
let io = null;

/**
 * In-memory presence map: userId (string) -> Set<socketId>.
 * A Set (not a single id) so a user with multiple tabs/devices open only
 * counts as "offline" once EVERY one of their sockets has disconnected.
 *
 * NOTE: this lives in process memory, so it only works for a single Node
 * process. If this app is ever scaled to multiple server instances, swap
 * this for the Socket.IO Redis adapter + a shared store (e.g. Redis) for
 * presence instead of a local Map.
 */
const onlineUsers = new Map();

const userRoom = (userId) => `user:${userId}`;
const conversationRoom = (conversationId) => `conversation:${conversationId}`;

/** Adds a socket id for a user. Returns true if this was their first socket (they just came online). */
function trackSocketOnline(userId, socketId) {
  const key = String(userId);
  if (!onlineUsers.has(key)) onlineUsers.set(key, new Set());
  const sockets = onlineUsers.get(key);
  const wasOffline = sockets.size === 0;
  sockets.add(socketId);
  return wasOffline;
}

/** Removes a socket id for a user. Returns true if they now have zero sockets left (fully offline). */
function trackSocketOffline(userId, socketId) {
  const key = String(userId);
  const sockets = onlineUsers.get(key);
  if (!sockets) return true;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(key);
    return true;
  }
  return false;
}

function isUserOnline(userId) {
  return onlineUsers.has(String(userId));
}

/**
 * Socket.IO auth middleware. Runs once per connection attempt, before
 * "connection" fires. Mirrors authMiddleware.js exactly (same cookie, same
 * JWT secret) so REST and sockets never disagree about who's logged in.
 */
function socketAuthMiddleware(socket, next) {
  try {
    const rawCookieHeader = socket.handshake.headers.cookie;
    if (!rawCookieHeader) {
      return next(new Error("Unauthorized"));
    }

    const parsedCookies = cookie.parse(rawCookieHeader);
    const token = parsedCookies.token;
    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error("Unauthorized"));
  }
}

/**
 * Fires when a socket finishes authenticating. Handles presence bookkeeping
 * and registers all the per-socket event listeners.
 */
async function handleConnection(socket) {
  const userId = socket.userId;

  // Every socket for this user joins a personal room so we can target
  // "this specific user, on all their devices" via emitToUser().
  socket.join(userRoom(userId));

  const justCameOnline = trackSocketOnline(userId, socket.id);

  if (justCameOnline) {
    try {
      await userModel.setUserOnline(userId);
    } catch (err) {
      console.error("Failed to persist online status:", err);
    }

    // Only tell people who actually have a conversation with this user —
    // no need to broadcast presence app-wide.
    await broadcastPresenceToContacts(userId, "user:online", { userId });
  }

  // Let this freshly-connected socket know which of ITS contacts are
  // currently online, so the client can paint presence dots immediately
  // instead of waiting for a "user:online" event that may never come
  // (e.g. the contact connected before this socket did).
  try {
    const contacts = await conversationModel.getContactIds(userId);
    const onlineContactIds = contacts
      .map((row) => row.contact_id)
      .filter((id) => isUserOnline(id));
    socket.emit("presence:online_contacts", { userIds: onlineContactIds });
  } catch (err) {
    console.error("Failed to load contacts for presence sync:", err);
  }

  // --- conversation:join / conversation:leave -------------------------
  // Clients join a conversation's room when they open that chat screen,
  // which is what lets us target message:new / typing:* / message:read
  // at exactly "everyone currently viewing this conversation".
  socket.on("conversation:join", async ({ conversationId } = {}) => {
    if (!conversationId) return;
    try {
      const membership = await conversationModel.isConversationMember(conversationId, userId);
      if (membership.rows.length === 0) {
        return socket.emit("conversation:error", {
          message: "You are not a member of this conversation",
        });
      }
      socket.join(conversationRoom(conversationId));
      socket.emit("conversation:joined", { conversationId });
    } catch (err) {
      console.error("conversation:join error:", err);
      socket.emit("conversation:error", { message: "Could not join conversation" });
    }
  });

  socket.on("conversation:leave", ({ conversationId } = {}) => {
    if (!conversationId) return;
    socket.leave(conversationRoom(conversationId));
  });

  // --- typing indicators -------------------------------------------------
  // Purely transient/live — nothing is persisted to the database.
  socket.on("typing:start", ({ conversationId } = {}) => {
    if (!conversationId) return;
    socket.to(conversationRoom(conversationId)).emit("typing:start", {
      conversationId,
      userId,
    });
  });

  socket.on("typing:stop", ({ conversationId } = {}) => {
    if (!conversationId) return;
    socket.to(conversationRoom(conversationId)).emit("typing:stop", {
      conversationId,
      userId,
    });
  });

  // --- read receipts (live-only for now) ---------------------------------
  // There's no `is_read`/`read_at` column on `messages` yet, so this is a
  // live broadcast only — it tells other viewers "user X has seen up to
  // this message" in real time, but a page refresh won't remember it.
  // Wire this up to a real column + UPDATE query if read receipts need to
  // survive a reload.
  socket.on("message:read", ({ conversationId, messageId } = {}) => {
    if (!conversationId || !messageId) return;
    socket.to(conversationRoom(conversationId)).emit("message:read", {
      conversationId,
      messageId,
      userId,
    });
  });

  // --- disconnect ----------------------------------------------------------
  socket.on("disconnect", async () => {
    const wentFullyOffline = trackSocketOffline(userId, socket.id);
    if (!wentFullyOffline) return; // user still has another tab/device open

    try {
      await userModel.logoutUser(userId); // sets is_online = FALSE, last_seen = NOW()
      const result = await userModel.getUserById(userId);
      const lastSeen = result.rows[0]?.last_seen ?? new Date().toISOString();
      await broadcastPresenceToContacts(userId, "user:offline", { userId, lastSeen });
    } catch (err) {
      console.error("Failed to persist offline status:", err);
    }
  });
}

/**
 * Emits `event` with `payload` to every conversation partner of `userId`
 * that is currently online — used for user:online / user:offline so we
 * don't spam every connected client with everyone else's presence.
 */
async function broadcastPresenceToContacts(userId, event, payload) {
  if (!io) return;
  try {
    const contacts = await conversationModel.getContactIds(userId);
    contacts.forEach((row) => {
      io.to(userRoom(row.contact_id)).emit(event, payload);
    });
  } catch (err) {
    console.error(`Failed to broadcast ${event}:`, err);
  }
}

/** Attaches Socket.IO to the given HTTP server. Call this once from index.js. */
function initSocket(server) {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // same origin as the Express CORS config
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);
  io.on("connection", (socket) => {
    handleConnection(socket).catch((err) => {
      console.error("Error handling socket connection:", err);
    });
  });

  console.log("Socket.IO initialized");
  return io;
}

/** Returns the live Socket.IO server instance. Throws if called before initSocket(). */
function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized yet. Call initSocket(server) first.");
  }
  return io;
}

/** Broadcasts `event` with `payload` to everyone currently in a conversation's room. */
function emitToConversation(conversationId, event, payload) {
  if (!io) return;
  io.to(conversationRoom(conversationId)).emit(event, payload);
}

/** Sends `event` with `payload` to one specific user, on all of their connected devices. */
function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(userRoom(userId)).emit(event, payload);
}

/**
 * Forcibly disconnects every socket belonging to a user. Used by REST
 * logout (POST /user/logout) so that clearing the httpOnly cookie also
 * tears down any live socket connections instead of leaving a "logged
 * out but still technically connected" socket lingering until it times
 * out on its own.
 */
function disconnectUserSockets(userId) {
  if (!io) return;
  io.in(userRoom(userId)).disconnectSockets(true);
}

module.exports = {
  initSocket,
  getIO,
  emitToConversation,
  emitToUser,
  disconnectUserSockets,
  isUserOnline,
};
