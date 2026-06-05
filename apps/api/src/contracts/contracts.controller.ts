import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import fs from "fs";
import { ContractsService } from "./contracts.service";
import { SendContractDto } from "./dto/send-contract.dto";
import { ApiKeyGuard } from "../common/guards/api-key.guard";
import { listContractsQuerySchema } from "@contracts/domain";
import { BadRequestException } from "@nestjs/common";

@Controller("contracts")
@UseGuards(ApiKeyGuard)
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  @Post("send")
  async send(@Body() dto: SendContractDto) {
    return this.contracts.send(dto);
  }

  @Get()
  async list(@Query() query: Record<string, string>) {
    const parsed = listContractsQuerySchema.safeParse({
      ...query,
      templateId: query.templateId ?? query.type,
    });
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.contracts.list(parsed.data);
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    return this.contracts.findById(id);
  }

  @Post(":id/cancel")
  async cancel(@Param("id") id: string) {
    return this.contracts.cancel(id);
  }

  @Post(":id/resend")
  async resend(@Param("id") id: string) {
    return this.contracts.resend(id);
  }

  @Get(":id/download")
  async download(@Param("id") id: string, @Res() res: Response) {
    const { path: filePath, url } = await this.contracts.getDownloadPath(id);
    if (url) {
      return res.redirect(url);
    }
    if (filePath && fs.existsSync(filePath)) {
      return res.download(filePath);
    }
    throw new BadRequestException("File not found on disk");
  }
}
