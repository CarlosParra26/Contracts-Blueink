import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import type { BlueinkWebhookPayload } from "@contracts/domain";
import { BLUEINK_WEBHOOK_QUEUE } from "../queue/queue.module";
import { WebhookEventHandler } from "./webhook-event.handler";

@Processor(BLUEINK_WEBHOOK_QUEUE)
export class WebhookProcessor extends WorkerHost {
  constructor(private readonly handler: WebhookEventHandler) {
    super();
  }

  async process(job: Job<BlueinkWebhookPayload>): Promise<void> {
    await this.handler.handle(job.data);
  }
}
