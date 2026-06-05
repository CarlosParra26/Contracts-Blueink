import { Module, Global } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule, ConfigService } from "@nestjs/config";

export const BLUEINK_WEBHOOK_QUEUE = "blueink-webhook";

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>("REDIS_URL");
        if (!redisUrl) {
          return {
            connection: { host: "127.0.0.1", port: 6379, maxRetriesPerRequest: null },
          };
        }
        return { connection: { url: redisUrl, maxRetriesPerRequest: null } };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: BLUEINK_WEBHOOK_QUEUE }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
