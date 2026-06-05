import { Module } from "@nestjs/common";
import { ContractsService } from "./contracts.service";
import { ContractsController } from "./contracts.controller";
import { TemplatesModule } from "../templates/templates.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [TemplatesModule, NotificationsModule],
  providers: [ContractsService],
  controllers: [ContractsController],
  exports: [ContractsService],
})
export class ContractsModule {}
