import { Module } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsController } from './audit-logs.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationGateway } from './notification.gateway';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, NotificationGateway],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
