import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@contracts/db";
import {
  mapBlueinkToDomain,
  sendContractSchema,
  type SendContractInput,
  type ListContractsQuery,
} from "@contracts/domain";
import { BlueinkApiError } from "@contracts/blueink-client";
import { BlueinkService } from "../blueink/blueink.service";
import { TemplatesService } from "../templates/templates.service";
import { NotificationsService } from "../notifications/notifications.service";
import type { SendContractDto } from "./dto/send-contract.dto";

@Injectable()
export class ContractsService {
  constructor(
    private readonly blueink: BlueinkService,
    private readonly templates: TemplatesService,
    private readonly notifications: NotificationsService,
  ) {}

  async send(dto: SendContractDto) {
    const parsed = sendContractSchema.safeParse({
      ...dto,
      fields: dto.fields ?? {},
    });
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    const input: SendContractInput = parsed.data;

    let templateInfo;
    try {
      templateInfo = await this.templates.fetchFromBlueink(input.templateId);
      await this.templates.validateSigners(input.templateId, input.signers);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Invalid template or signers",
      );
    }

    const draft = await prisma.contract.create({
      data: {
        contractType: input.templateId,
        matchId: input.matchId,
        metadata: {
          ...(input.metadata ?? {}),
          blueinkTemplateId: input.templateId,
          templateName: templateInfo.name ?? null,
          label: input.label ?? null,
        } as object,
        status: input.send ? "sent" : "draft",
        requesterEmail: input.requesterEmail,
        requesterName: input.requesterName,
        signers: input.signers,
        fieldValues: input.fields as object,
        isTest: input.isTest,
      },
    });

    try {
      const { bundleId, status } = await this.blueink.createBundle({
        input,
        templateId: input.templateId,
        templateName: templateInfo.name,
      });

      const domainStatus = mapBlueinkToDomain(status);

      const updated = await prisma.contract.update({
        where: { id: draft.id },
        data: {
          blueinkBundleId: bundleId,
          status: domainStatus,
          statusUpdatedAt: new Date(),
        },
      });

      await this.notifications.sendContractSent(updated).catch(() => undefined);

      return this.toResponse(updated);
    } catch (error) {
      await prisma.contract.update({
        where: { id: draft.id },
        data: { status: "failed", statusUpdatedAt: new Date() },
      });
      if (error instanceof BlueinkApiError) {
        throw new BadRequestException({
          message: error.message,
          blueink: error.response,
          statusCode: error.statusCode,
        });
      }
      throw error;
    }
  }

  async findById(id: string) {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { events: { orderBy: { processedAt: "desc" }, take: 50 } },
    });
    if (!contract) throw new NotFoundException(`Contract ${id} not found`);

    if (contract.blueinkBundleId) {
      try {
        const remote = await this.blueink.retrieveBundle(
          contract.blueinkBundleId,
        );
        const remoteStatus = (remote as { status?: string }).status;
        if (remoteStatus) {
          const mapped = mapBlueinkToDomain(remoteStatus);
          if (mapped !== contract.status) {
            return this.toResponse(
              await prisma.contract.update({
                where: { id },
                data: {
                  status: mapped,
                  statusUpdatedAt: new Date(),
                },
                include: {
                  events: { orderBy: { processedAt: "desc" }, take: 50 },
                },
              }),
            );
          }
        }
      } catch {
        // keep local status if BlueInk unavailable
      }
    }

    return this.toResponse(contract);
  }

  async list(query: ListContractsQuery) {
    const where: {
      contractType?: string;
      status?: string;
      matchId?: string;
    } = {};
    if (query.templateId) where.contractType = query.templateId;
    if (query.status) where.status = query.status;
    if (query.matchId) where.matchId = query.matchId;

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.contract.count({ where }),
    ]);

    return {
      items: items.map((c) => this.toResponse(c)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async cancel(id: string) {
    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException(`Contract ${id} not found`);
    if (!contract.blueinkBundleId) {
      throw new BadRequestException("Contract has no BlueInk bundle");
    }
    await this.blueink.cancelBundle(contract.blueinkBundleId);
    const updated = await prisma.contract.update({
      where: { id },
      data: { status: "cancelled", statusUpdatedAt: new Date() },
    });
    return this.toResponse(updated);
  }

  async resend(id: string) {
    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException(`Contract ${id} not found`);

    const signers = contract.signers as Array<{ email: string }>;
    const client = this.blueink.getClient();
    const bundle = await this.blueink.retrieveBundle(
      contract.blueinkBundleId!,
    );
    const packets = (bundle as { packets?: Array<{ id: string }> }).packets;
    const packetId = packets?.[0]?.id;
    if (!packetId) {
      throw new BadRequestException("No packet found to remind");
    }
    await client.packets.remind(packetId);
    await this.notifications
      .sendReminder(contract, signers[0]?.email)
      .catch(() => undefined);
    return this.toResponse(contract);
  }

  async getDownloadPath(id: string) {
    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException(`Contract ${id} not found`);
    if (!contract.signedPdfPath && !contract.signedPdfUrl) {
      throw new NotFoundException("Signed document not available yet");
    }
    return {
      path: contract.signedPdfPath,
      url: contract.signedPdfUrl,
    };
  }

  toResponse(contract: {
    id: string;
    contractType: string;
    matchId: string | null;
    metadata: unknown;
    blueinkBundleId: string | null;
    status: string;
    statusUpdatedAt: Date;
    requesterEmail: string;
    requesterName: string;
    signers: unknown;
    fieldValues: unknown;
    signedPdfPath: string | null;
    signedPdfUrl: string | null;
    isTest: boolean;
    createdAt: Date;
    updatedAt: Date;
    events?: Array<{
      id: string;
      eventType: string;
      eventId: string;
      processedAt: Date;
    }>;
  }) {
    const metadata = contract.metadata as Record<string, unknown> | null;
    return {
      id: contract.id,
      templateId: contract.contractType,
      templateName: metadata?.templateName ?? null,
      matchId: contract.matchId,
      metadata: contract.metadata,
      blueinkBundleId: contract.blueinkBundleId,
      status: contract.status,
      statusUpdatedAt: contract.statusUpdatedAt,
      requester: {
        name: contract.requesterName,
        email: contract.requesterEmail,
      },
      signers: contract.signers,
      fieldValues: contract.fieldValues,
      signedPdfPath: contract.signedPdfPath,
      signedPdfUrl: contract.signedPdfUrl,
      isTest: contract.isTest,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
      events: contract.events?.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        eventId: e.eventId,
        processedAt: e.processedAt,
      })),
    };
  }
}
