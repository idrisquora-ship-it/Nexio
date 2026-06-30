import { Directory, File, Paths } from "expo-file-system";

export type StorageBreakdown = {
  uploadQueueBytes: number;
  messageQueueBytes: number;
  storyQueueBytes: number;
  gigDraftsBytes: number;
  businessEditBytes: number;
  gigWizardBytes: number;
  totalBytes: number;
};

async function fileSize(file: File): Promise<number> {
  try {
    if (!file.exists) return 0;
    const info = file.info();
    return info.size ?? 0;
  } catch {
    return 0;
  }
}

export async function getOfflineStorageBreakdown(): Promise<StorageBreakdown> {
  const dir = new Directory(Paths.document, "nexio");
  const uploadQueueBytes = await fileSize(new File(dir, "upload-queue.json"));
  const messageQueueBytes = await fileSize(new File(dir, "message-queue.json"));
  const storyQueueBytes = await fileSize(new File(dir, "story-queue.json"));
  const gigDraftsBytes = await fileSize(new File(dir, "gig-drafts.json"));
  const businessEditBytes = await fileSize(new File(dir, "business-edit-queue.json"));
  const gigWizardBytes = await fileSize(new File(dir, "gig-wizard-queue.json"));

  return {
    uploadQueueBytes,
    messageQueueBytes,
    storyQueueBytes,
    gigDraftsBytes,
    businessEditBytes,
    gigWizardBytes,
    totalBytes:
      uploadQueueBytes +
      messageQueueBytes +
      storyQueueBytes +
      gigDraftsBytes +
      businessEditBytes +
      gigWizardBytes,
  };
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function clearOfflineQueues() {
  const dir = new Directory(Paths.document, "nexio");
  for (const name of [
    "upload-queue.json",
    "message-queue.json",
    "story-queue.json",
    "business-edit-queue.json",
    "gig-wizard-queue.json",
  ]) {
    const file = new File(dir, name);
    if (file.exists) file.delete();
  }
}

export async function clearGigDraftStorage() {
  const file = new File(new Directory(Paths.document, "nexio"), "gig-drafts.json");
  if (file.exists) file.delete();
}
