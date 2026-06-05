import { Module } from "@nestjs/common";
import { WebhooksController } from "./webhooks.controller";
import { WebhooksService } from "./webhooks.service";
import { WebhookProcessor } from "./webhook.processor";
import { WebhookEventHandler } from "./webhook-event.handler";
import { RealtimeModule } from "../realtime/realtime.module";
import { StorageModule } from "../storage/storage.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [RealtimeModule, StorageModule, NotificationsModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhookProcessor, WebhookEventHandler],
  exports: [WebhooksService],
})
export class WebhooksModule {}
