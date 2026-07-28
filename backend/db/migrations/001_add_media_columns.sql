-- Adds the media-message columns that models/conversationModel.js's
-- saveMessage() already writes to (and sendMediaMessage.js relies on),
-- but that were missing from the actual `messages` table — which is why
-- even a plain text send was failing with:
--   error: column "media_mime_type" of relation "messages" does not exist
--
-- Safe to run multiple times (IF NOT EXISTS on every column).
-- Run with: node db/migrate.js   (see that file), or paste this
-- directly into psql / your Postgres client.

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS message_type   VARCHAR(20)  NOT NULL DEFAULT 'TEXT',
  ADD COLUMN IF NOT EXISTS media_url      TEXT,
  ADD COLUMN IF NOT EXISTS media_name     TEXT,
  ADD COLUMN IF NOT EXISTS media_size     BIGINT,
  ADD COLUMN IF NOT EXISTS media_mime_type VARCHAR(255);
