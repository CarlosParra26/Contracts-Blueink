import { Injectable, Logger } from "@nestjs/common";
import { prisma } from "@contracts/db";
import {
  WEBHOOK_EVENT_STATUS_MAP,
  type BlueinkWebhookPayload,
} from "@contracts/domain";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { StorageService } from "../storage/storage.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class WebhookEventHandler {
  private readonly logger = new Logger(WebhookEventHandler.name);

  constructor(
    private readonly realtime: RealtimeGateway,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  async handle(payload: BlueinkWebhookPayload): Promise<void> {
    const bundleId = payload.payload?.bundle_id;
    if (!bundleId) {
      this.logger.warn(`Webhook ${payload.event_id} missing bundle_id`);
      return;
    }

    const contract = await prisma.contract.findFirst({
      where: { blueinkBundleId: bundleId },
    });
    if (!contract) {
      this.logger.warn(`No contract for bundle ${bundleId}`);
      return;
    }

    const existing = await prisma.contractEvent.findUnique({
      where: { eventId: payload.event_id },
    });
    if (existing) return;

    const newStatus = WEBHOOK_EVENT_STATUS_MAP[payload.event_type];
    const updateData: {
      status?: string;
      statusUpdatedAt: Date;
      signedPdfPath?: string;
      signedPdfUrl?: string;
    } = { statusUpdatedAt: new Date() };

    if (newStatus) {
      updateData.status = newStatus;
    }

    let storedPdfPath: string | undefined;

    if (payload.event_type === "bundle_docs_ready") {
      try {
        const stored = await this.storage.storeSignedPdfFromBundle(
          contract.id,
          bundleId,
        );
        updateData.signedPdfPath = stored.path;
        updateData.signedPdfUrl = stored.url ?? undefined;
        storedPdfPath = stored.path;
      } catch (err) {
        this.logger.error(`Failed to store PDF for ${contract.id}`, err);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.contractEvent.create({
        data: {
          contractId: contract.id,
          eventId: payload.event_id,
          eventType: payload.event_type,
          payload: payload as object,
        },
      });
      return tx.contract.update({
        where: { id: contract.id },
        data: updateData,
      });
    });

    this.realtime.emitContractUpdated({
      id: updated.id,
      status: updated.status,
      blueinkBundleId: updated.blueinkBundleId,
    });

    if (payload.event_type === "bundle_docs_ready" && storedPdfPath) {
      await this.notifications
        .sendContractCompleted({
          ...updated,
          signedPdfPath: storedPdfPath,
        })
        .catch(() => undefined);
    }

    if (payload.event_type === "packet_declined") {
      await this.notifications
        .sendContractDeclined(updated)
        .catch(() => undefined);
    }
  }
}
