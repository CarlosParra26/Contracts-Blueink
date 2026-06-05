import { Body, Controller, Headers, Post } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UnauthorizedException } from "@nestjs/common";
import { WebhooksService } from "./webhooks.service";

@Controller("webhooks")
export class WebhooksController {
  constructor(
    private readonly webhooks: WebhooksService,
    private readonly config: ConfigService,
  ) {}

  @Post("blueink")
  async blueink(
    @Body() body: unknown,
    @Headers("x-webhook-secret") secret?: string,
  ) {
    const expected = this.config.get<string>("WEBHOOK_SIGNING_SECRET");
    if (expected && secret !== expected) {
      throw new UnauthorizedException("Invalid webhook secret");
    }
    await this.webhooks.handle(body);
    return { ok: true };
  }
}
