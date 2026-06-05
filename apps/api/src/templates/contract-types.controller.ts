import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { TemplatesService } from "./templates.service";
import { ApiKeyGuard } from "../common/guards/api-key.guard";

@Controller("templates")
@UseGuards(ApiKeyGuard)
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get(":templateId")
  async getTemplate(@Param("templateId") templateId: string) {
    return this.templates.getTemplateDetail(templateId);
  }
}
