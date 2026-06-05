import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from "@nestjs/websockets";
import { Server } from "socket.io";
import { Logger } from "@nestjs/common";

@WebSocketGateway({ cors: { origin: "*" } })
export class RealtimeGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  afterInit() {
    this.logger.log("Socket.io gateway initialized");
  }

  emitContractUpdated(payload: {
    id: string;
    status: string;
    blueinkBundleId: string | null;
  }) {
    this.server?.emit("server:contract:updated", { data: payload });
  }
}
