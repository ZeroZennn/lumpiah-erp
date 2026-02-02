import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AuditLog } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', '*'],
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('NotificationGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  sendNewAuditLog(auditLog: AuditLog) {
    this.logger.log(`Broadcasting new audit log: ${auditLog.id}`);
    this.server.emit('new_audit_log', auditLog);
  }
}
