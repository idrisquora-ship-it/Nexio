import { Directory, File, Paths } from "expo-file-system";
import {
  publishGig,
  updateGigBasics,
  updateGigDetails,
  updateGigMedia,
  upsertGigPackages,
  type GigFaqItem,
  type PackageInput,
} from "../../features/marketplace/api/marketplaceApi";

export type GigWizardSnapshot = {
  id: string;
  gigId: string | null;
  businessId: string;
  step: number;
  title: string;
  category: string;
  subCategory: string;
  shortDescription: string;
  tagsText: string;
  packages: PackageInput[];
  coverUrl: string | null;
  galleryUrls: string[];
  description: string;
  buyerRequirements: string;
  faq: GigFaqItem[];
  publishOnSync: boolean;
  attempts: number;
  updatedAt: string;
};

const QUEUE_DIR = new Directory(Paths.document, "nexio");
const QUEUE_FILE = new File(QUEUE_DIR, "gig-wizard-queue.json");

async function readQueue(): Promise<GigWizardSnapshot[]> {
  try {
    if (!QUEUE_FILE.exists) return [];
    return JSON.parse(await QUEUE_FILE.text()) as GigWizardSnapshot[];
  } catch {
    return [];
  }
}

async function writeQueue(items: GigWizardSnapshot[]) {
  if (!QUEUE_DIR.exists) QUEUE_DIR.create();
  if (!QUEUE_FILE.exists) QUEUE_FILE.create();
  await QUEUE_FILE.write(JSON.stringify(items));
}

export async function saveGigWizardSnapshot(
  snapshot: Omit<GigWizardSnapshot, "id" | "attempts" | "updatedAt"> & { id?: string },
) {
  const queue = await readQueue();
  const entry: GigWizardSnapshot = {
    ...snapshot,
    id: snapshot.id ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
    attempts: 0,
    updatedAt: new Date().toISOString(),
  };
  const next = [entry, ...queue.filter((item) => item.id !== entry.id)];
  await writeQueue(next);
  return entry;
}

async function syncSnapshot(snapshot: GigWizardSnapshot) {
  let gigId = snapshot.gigId;
  const tags = snapshot.tagsText.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5);

  if (!gigId) {
    throw new Error("Gig ID required for wizard sync");
  }

  await updateGigBasics(gigId, {
    title: snapshot.title.trim(),
    category: snapshot.category,
    subCategory: snapshot.subCategory.trim(),
    shortDescription: snapshot.shortDescription.trim(),
    tags,
  });

  if (snapshot.step >= 2) {
    await upsertGigPackages(gigId, snapshot.packages);
  }

  if (snapshot.step >= 3 && (snapshot.coverUrl || snapshot.galleryUrls.length)) {
    await updateGigMedia(gigId, {
      coverImageUrl: snapshot.coverUrl,
      galleryUrls: snapshot.galleryUrls,
    });
  }

  if (snapshot.step >= 4) {
    await updateGigDetails(gigId, {
      description: snapshot.description,
      buyerRequirements: snapshot.buyerRequirements,
      faq: snapshot.faq.filter((item) => item.question.trim() && item.answer.trim()),
    });
  }

  if (snapshot.publishOnSync) {
    await publishGig(gigId);
  }
}

export async function processGigWizardQueue() {
  const queue = await readQueue();
  if (!queue.length) return { processed: 0, failed: 0, pending: 0 };

  const remaining: GigWizardSnapshot[] = [];
  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      if (!item.gigId) {
        throw new Error("Missing gig ID");
      }
      await syncSnapshot(item);
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

export async function getPendingGigWizardCount() {
  return (await readQueue()).length;
}

export async function clearGigWizardQueue() {
  await writeQueue([]);
}

export async function listGigWizardSnapshots() {
  return readQueue();
}
