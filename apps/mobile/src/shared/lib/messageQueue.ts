import { Directory, File, Paths } from "expo-file-system";
import { sendMessage } from "../../features/messaging/api/messagingApi";
import type { Database } from "@nexio/supabase";

type ContentType = Database["public"]["Enums"]["message_content_type"];

export type PendingMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  clientId: string;
  contentType: ContentType;
  replyToId?: string | null;
  attempts: number;
  createdAt: string;
};

const QUEUE_DIR = new Directory(Paths.document, "nexio");
const QUEUE_FILE = new File(QUEUE_DIR, "message-queue.json");

async function readQueue(): Promise<PendingMessage[]> {
  try {
    if (!QUEUE_FILE.exists) return [];
    const raw = await QUEUE_FILE.text();
    return JSON.parse(raw) as PendingMessage[];
  } catch {
    return [];
  }
}

async function writeQueue(items: PendingMessage[]) {
  if (!QUEUE_DIR.exists) QUEUE_DIR.create();
  if (!QUEUE_FILE.exists) QUEUE_FILE.create();
  await QUEUE_FILE.write(JSON.stringify(items));
}

export async function enqueueMessage(
  item: Omit<PendingMessage, "attempts" | "createdAt" | "id">,
) {
  const queue = await readQueue();
  const entry: PendingMessage = {
    ...item,
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
  queue.push(entry);
  await writeQueue(queue);
  return entry;
}

export async function processMessageQueue() {
  const queue = await readQueue();
  if (!queue.length) return { processed: 0, failed: 0, pending: 0 };

  const remaining: PendingMessage[] = [];
  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await sendMessage({
        conversationId: item.conversationId,
        senderId: item.senderId,
        body: item.body,
        clientId: item.clientId,
        contentType: item.contentType,
        replyToId: item.replyToId,
      });
      processed += 1;
    } catch {
      const next = { ...item, attempts: item.attempts + 1 };
      if (next.attempts < 5) remaining.push(next);
      else failed += 1;
    }
  }

  await writeQueue(remaining);
  return { processed, failed, pending: remaining.length };
}

export async function getPendingMessageCount() {
  const queue = await readQueue();
  return queue.length;
}

export async function clearMessageQueue() {
  await writeQueue([]);
}
