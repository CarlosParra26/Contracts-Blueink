import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import {
  blueinkWebhookSchema,
  type BlueinkWebhookPayload,
} from "@contracts/domain";
import { BLUEINK_WEBHOOK_QUEUE } from "../queue/queue.module";
import { WebhookEventHandler } from "./webhook-event.handler";

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectQueue(BLUEINK_WEBHOOK_QUEUE) private readonly queue: Queue,
    private readonly handler: WebhookEventHandler,
  ) {}

  async handle(payload: unknown): Promise<{ accepted: boolean }> {
    const parsed = blueinkWebhookSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.warn("Invalid webhook payload", parsed.error.flatten());
      return { accepted: false };
    }

    const data: BlueinkWebhookPayload = parsed.data;

    try {
      await this.queue.add("process", data, {
        jobId: data.event_id,
        removeOnComplete: true,
        removeOnFail: 100,
      });
    } catch (error) {
      this.logger.warn(
        "Queue unavailable, processing webhook synchronously",
        error,
      );
      await this.handler.handle(data);
    }

    return { accepted: true };
  }
}
