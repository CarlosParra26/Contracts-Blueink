import { Controller, Get } from "@nestjs/common";
import { prisma } from "@contracts/db";
import { BlueinkService } from "../blueink/blueink.service";

@Controller("health")
export class HealthController {
  constructor(private readonly blueink: BlueinkService) {}

  @Get()
  async check() {
    let db = "ok";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      db = "error";
    }

    let blueink = "skipped";
    if (process.env.BLUEINK_PRIVATE_API_KEY) {
      try {
        await this.blueink.listBundles({ per_page: 1 });
        blueink = "ok";
      } catch {
        blueink = "error";
      }
    }

    const healthy = db === "ok";
    return {
      status: healthy ? "ok" : "degraded",
      db,
      blueink,
      timestamp: new Date().toISOString(),
    };
  }
}
