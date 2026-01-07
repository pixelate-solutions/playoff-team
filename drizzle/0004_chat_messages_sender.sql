ALTER TABLE "chat_messages"
  ALTER COLUMN "entry_id" DROP NOT NULL;

ALTER TABLE "chat_messages"
  ADD COLUMN IF NOT EXISTS "sender_name" text;

ALTER TABLE "chat_messages"
  ADD COLUMN IF NOT EXISTS "sender_email" text;
