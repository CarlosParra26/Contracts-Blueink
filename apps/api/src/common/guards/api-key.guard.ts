import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const expected = this.config.get<string>("API_KEY");
    if (!expected) return true;

    const header = req.headers["x-api-key"] ?? req.headers.authorization;
    const provided =
      typeof header === "string" && header.startsWith("Bearer ")
        ? header.slice(7)
        : header;

    if (provided !== expected) {
      throw new UnauthorizedException("Invalid API key");
    }
    return true;
  }
}
