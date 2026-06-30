import { getPendingMessageCount } from "./messageQueue";
import { getPendingStoryCount } from "./storyQueue";
import { getPendingUploadCount, processUploadQueue } from "./uploadQueue";
import { processMessageQueue } from "./messageQueue";
import { processStoryQueue } from "./storyQueue";
import { getPendingBusinessEditCount, processBusinessEditQueue } from "./businessEditQueue";
import { getPendingGigWizardCount, processGigWizardQueue } from "./gigWizardQueue";

export type SyncResult = {
  processed: number;
  failed: number;
  pending: number;
};

export async function getTotalPendingCount() {
  const [messages, uploads, stories, businessEdits, gigWizard] = await Promise.all([
    getPendingMessageCount(),
    getPendingUploadCount(),
    getPendingStoryCount(),
    getPendingBusinessEditCount(),
    getPendingGigWizardCount(),
  ]);
  return messages + uploads + stories + businessEdits + gigWizard;
}

export async function runOfflineSync(): Promise<SyncResult> {
  const messageResult = await processMessageQueue();
  const uploadResult = await processUploadQueue();
  const storyResult = await processStoryQueue();
  const businessResult = await processBusinessEditQueue();
  const gigWizardResult = await processGigWizardQueue();

  return {
    processed:
      messageResult.processed +
      uploadResult.processed +
      storyResult.processed +
      businessResult.processed +
      gigWizardResult.processed,
    failed:
      messageResult.failed +
      uploadResult.failed +
      storyResult.failed +
      businessResult.failed +
      gigWizardResult.failed,
    pending:
      messageResult.pending +
      uploadResult.pending +
      storyResult.pending +
      businessResult.pending +
      gigWizardResult.pending,
  };
}
