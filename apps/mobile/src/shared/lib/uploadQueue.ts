import { Directory, File, Paths } from "expo-file-system";
import type { MediaMetadata, UploadableContentType } from "../../features/messaging/api/messagingApi";
import { sendMessage, uploadChatMedia } from "../../features/messaging/api/messagingApi";

export type PendingUpload = {
  id: string;
  conversationId: string;
  senderId: string;
  localUri: string;
  contentType: UploadableContentType;
  body: string;
  clientId: string;
  mimeType?: string;
  extension?: string;
  mediaMetadata?: MediaMetadata | null;
  replyToId?: string | null;
  attempts: number;
  createdAt: string;
};

const QUEUE_DIR = new Directory(Paths.document, "nexio");
const QUEUE_FILE = new File(QUEUE_DIR, "upload-queue.json");

async function readQueue(): Promise<PendingUpload[]> {
  try {
    if (!QUEUE_FILE.exists) return [];
    const raw = await QUEUE_FILE.text();
    return JSON.parse(raw) as PendingUpload[];
  } catch {
    return [];
  }
}

async function writeQueue(items: PendingUpload[]) {
  if (!QUEUE_DIR.exists) QUEUE_DIR.create();
  if (!QUEUE_FILE.exists) QUEUE_FILE.create();
  await QUEUE_FILE.write(JSON.stringify(items));
}

export async function enqueueUpload(item: Omit<PendingUpload, "attempts" | "createdAt" | "id">) {
  const queue = await readQueue();
  const entry: PendingUpload = {
    ...item,
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
  queue.push(entry);
  await writeQueue(queue);
  return entry;
}

export async function processUploadQueue() {
  const queue = await readQueue();
  if (!queue.length) return { processed: 0, failed: 0, pending: 0 };

  const remaining: PendingUpload[] = [];
  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const path = await uploadChatMedia(
        item.conversationId,
        item.senderId,
        item.localUri,
        item.contentType,
        { extension: item.extension, mimeType: item.mimeType },
      );
      await sendMessage({
        conversationId: item.conversationId,
        senderId: item.senderId,
        body: item.body,
        clientId: item.clientId,
        contentType: item.contentType,
        mediaUrl: path,
        mediaMetadata: item.mediaMetadata,
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

export async function getPendingUploadCount() {
  const queue = await readQueue();
  return queue.length;
}
