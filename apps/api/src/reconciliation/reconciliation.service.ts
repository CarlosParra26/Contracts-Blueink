import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { prisma } from "@contracts/db";
import { mapBlueinkToDomain } from "@contracts/domain";
import { BlueinkService } from "../blueink/blueink.service";

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    private readonly blueink: BlueinkService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async reconcileOpenContracts() {
    if (this.config.get("RECONCILIATION_ENABLED") === "false") return;
    if (!process.env.BLUEINK_PRIVATE_API_KEY) return;

    const open = await prisma.contract.findMany({
      where: {
        blueinkBundleId: { not: null },
        status: { in: ["draft", "sent", "in_progress"] },
      },
      take: 100,
    });

    for (const contract of open) {
      try {
        const remote = await this.blueink.retrieveBundle(
          contract.blueinkBundleId!,
        );
        const status = (remote as { status?: string }).status;
        if (!status) continue;
        const mapped = mapBlueinkToDomain(status);
        if (mapped !== contract.status) {
          await prisma.contract.update({
            where: { id: contract.id },
            data: { status: mapped, statusUpdatedAt: new Date() },
          });
          this.logger.log(
            `Reconciled ${contract.id}: ${contract.status} -> ${mapped}`,
          );
        }
      } catch (err) {
        this.logger.warn(`Reconcile failed for ${contract.id}`, err);
      }
    }
  }
}
