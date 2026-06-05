import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import path from "path";
import { findMonorepoRoot } from "./common/monorepo-root";
import { BlueinkModule } from "./blueink/blueink.module";
import { ContractsModule } from "./contracts/contracts.module";
import { TemplatesModule } from "./templates/templates.module";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { StorageModule } from "./storage/storage.module";
import { HealthModule } from "./health/health.module";
import { ReconciliationModule } from "./reconciliation/reconciliation.module";
import { QueueModule } from "./queue/queue.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.join(findMonorepoRoot(), ".env"),
    }),
    ScheduleModule.forRoot(),
    QueueModule,
    BlueinkModule,
    TemplatesModule,
    ContractsModule,
    WebhooksModule,
    NotificationsModule,
    RealtimeModule,
    StorageModule,
    HealthModule,
    ReconciliationModule,
  ],
})
export class AppModule {}
