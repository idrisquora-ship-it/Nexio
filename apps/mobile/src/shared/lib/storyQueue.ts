import { Directory, File, Paths } from "expo-file-system";
import { createStory, uploadStoryMedia } from "../../features/updates/api/updatesApi";

export type PendingStory = {
  id: string;
  userId: string;
  storyType: "text" | "photo" | "video";
  textContent?: string;
  backgroundColor?: string;
  localUri?: string;
  isVideo?: boolean;
  attempts: number;
  createdAt: string;
};

const QUEUE_DIR = new Directory(Paths.document, "nexio");
const QUEUE_FILE = new File(QUEUE_DIR, "story-queue.json");

async function readQueue(): Promise<PendingStory[]> {
  try {
    if (!QUEUE_FILE.exists) return [];
    const raw = await QUEUE_FILE.text();
    return JSON.parse(raw) as PendingStory[];
  } catch {
    return [];
  }
}

async function writeQueue(items: PendingStory[]) {
  if (!QUEUE_DIR.exists) QUEUE_DIR.create();
  if (!QUEUE_FILE.exists) QUEUE_FILE.create();
  await QUEUE_FILE.write(JSON.stringify(items));
}

export async function enqueueStory(item: Omit<PendingStory, "attempts" | "createdAt" | "id">) {
  const queue = await readQueue();
  const entry: PendingStory = {
    ...item,
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
  queue.push(entry);
  await writeQueue(queue);
  return entry;
}

export async function processStoryQueue() {
  const queue = await readQueue();
  if (!queue.length) return { processed: 0, failed: 0, pending: 0 };

  const remaining: PendingStory[] = [];
  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      if (item.storyType === "text") {
        await createStory({
          storyType: "text",
          textContent: item.textContent ?? "",
          backgroundColor: item.backgroundColor,
        });
      } else if (item.localUri) {
        const path = await uploadStoryMedia(
          item.userId,
          item.id,
          item.localUri,
          item.isVideo ?? false,
        );
        await createStory({
          storyType: item.storyType === "video" ? "video" : "photo",
          mediaPath: path,
        });
      }
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

export async function getPendingStoryCount() {
  const queue = await readQueue();
  return queue.length;
}

export async function clearStoryQueue() {
  await writeQueue([]);
}
