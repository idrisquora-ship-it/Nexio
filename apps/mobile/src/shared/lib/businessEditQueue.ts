import { Directory, File, Paths } from "expo-file-system";
import { updateBusinessProfile } from "../../features/marketplace/api/marketplaceApi";
import type { Database } from "@nexio/supabase";

type BusinessPatch = Partial<
  Pick<
    Database["public"]["Tables"]["business_profiles"]["Row"],
    "business_name" | "tagline" | "description" | "category" | "logo_url" | "banner_url"
  >
>;

export type PendingBusinessEdit = {
  id: string;
  businessId: string;
  patch: BusinessPatch;
  attempts: number;
  createdAt: string;
};

const QUEUE_DIR = new Directory(Paths.document, "nexio");
const QUEUE_FILE = new File(QUEUE_DIR, "business-edit-queue.json");

async function readQueue(): Promise<PendingBusinessEdit[]> {
  try {
    if (!QUEUE_FILE.exists) return [];
    return JSON.parse(await QUEUE_FILE.text()) as PendingBusinessEdit[];
  } catch {
    return [];
  }
}

async function writeQueue(items: PendingBusinessEdit[]) {
  if (!QUEUE_DIR.exists) QUEUE_DIR.create();
  if (!QUEUE_FILE.exists) QUEUE_FILE.create();
  await QUEUE_FILE.write(JSON.stringify(items));
}

export async function enqueueBusinessEdit(businessId: string, patch: BusinessPatch) {
  const queue = await readQueue();
  const existing = queue.find((item) => item.businessId === businessId);
  const entry: PendingBusinessEdit = existing
    ? {
        ...existing,
        patch: { ...existing.patch, ...patch },
        attempts: 0,
        createdAt: new Date().toISOString(),
      }
    : {
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
        businessId,
        patch,
        attempts: 0,
        createdAt: new Date().toISOString(),
      };
  const next = [entry, ...queue.filter((item) => item.businessId !== businessId)];
  await writeQueue(next);
  return entry;
}

export async function processBusinessEditQueue() {
  const queue = await readQueue();
  if (!queue.length) return { processed: 0, failed: 0, pending: 0 };

  const remaining: PendingBusinessEdit[] = [];
  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await updateBusinessProfile(item.businessId, item.patch);
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

export async function getPendingBusinessEditCount() {
  return (await readQueue()).length;
}

export async function clearBusinessEditQueue() {
  await writeQueue([]);
}
