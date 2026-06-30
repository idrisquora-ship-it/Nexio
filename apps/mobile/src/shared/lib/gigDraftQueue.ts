import { Directory, File, Paths } from "expo-file-system";

export type GigDraft = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  updatedAt: string;
};

const QUEUE_DIR = new Directory(Paths.document, "nexio");
const DRAFTS_FILE = new File(QUEUE_DIR, "gig-drafts.json");

async function readDrafts(): Promise<GigDraft[]> {
  try {
    if (!DRAFTS_FILE.exists) return [];
    const raw = await DRAFTS_FILE.text();
    return JSON.parse(raw) as GigDraft[];
  } catch {
    return [];
  }
}

async function writeDrafts(items: GigDraft[]) {
  if (!QUEUE_DIR.exists) QUEUE_DIR.create();
  if (!DRAFTS_FILE.exists) DRAFTS_FILE.create();
  await DRAFTS_FILE.write(JSON.stringify(items));
}

export async function saveGigDraft(draft: Omit<GigDraft, "id" | "updatedAt"> & { id?: string }) {
  const drafts = await readDrafts();
  const entry: GigDraft = {
    id: draft.id ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
    title: draft.title,
    description: draft.description,
    tags: draft.tags,
    updatedAt: new Date().toISOString(),
  };
  const next = [entry, ...drafts.filter((d) => d.id !== entry.id)];
  await writeDrafts(next);
  return entry;
}

export async function listGigDrafts() {
  return readDrafts();
}

export async function deleteGigDraft(id: string) {
  const drafts = await readDrafts();
  await writeDrafts(drafts.filter((d) => d.id !== id));
}

export async function getGigDraftCount() {
  const drafts = await readDrafts();
  return drafts.length;
}

export async function clearGigDrafts() {
  await writeDrafts([]);
}
