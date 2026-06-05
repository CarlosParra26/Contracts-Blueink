import { BadRequestException, Injectable } from "@nestjs/common";
import type { BlueinkTemplateInfo } from "@contracts/domain";
import { retrieveTemplate } from "@contracts/blueink-client";
import { BlueinkService } from "../blueink/blueink.service";

@Injectable()
export class TemplatesService {
  constructor(private readonly blueink: BlueinkService) {}

  async fetchFromBlueink(templateId: string): Promise<BlueinkTemplateInfo> {
    return retrieveTemplate(this.blueink.getClient(), templateId);
  }

  async getTemplateDetail(templateId: string) {
    const info = await this.fetchFromBlueink(templateId);
    return {
      templateId: info.id || templateId,
      name: info.name,
      fieldCount: info.fieldCount,
      signerCount: info.signerCount,
      roles: info.roles,
      fields: info.fields.map((f) => ({
        key: f.key,
        kind: f.kind,
        label: f.label,
        page: f.page,
        role: f.role,
        required: f.required,
      })),
    };
  }

  async validateSigners(
    templateId: string,
    signers: Array<{ role: string }>,
  ): Promise<void> {
    const info = await this.fetchFromBlueink(templateId);
    const validRoles = new Set(
      info.roles.map((r) => r.key).filter((k) => k.length > 0),
    );
    if (validRoles.size === 0) return;

    for (const signer of signers) {
      if (!validRoles.has(signer.role)) {
        throw new BadRequestException(
          `Invalid role "${signer.role}". Template roles: ${[...validRoles].join(", ")}`,
        );
      }
    }
  }
}
